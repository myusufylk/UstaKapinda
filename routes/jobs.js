const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const User = require('../models/User');
const Craftsman = require('../models/Craftsman');
const { auth, checkRole } = require('../middleware/auth');
const { jobValidationRules, validate } = require('../middleware/validator');
const { sendJobNotificationEmail } = require('../utils/email');
const upload = require('../middleware/upload');

// Get all jobs with filters
router.get('/', async (req, res) => {
    try {
        const {
            category,
            city,
            minBudget,
            maxBudget,
            status,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            page = 1,
            limit = 10
        } = req.query;

        // Build query
        const query = {};
        if (category) query.category = category;
        if (city) query['location.city'] = city;
        if (status) query.status = status;
        if (minBudget || maxBudget) {
            query.budget = {};
            if (minBudget) query.budget.$gte = Number(minBudget);
            if (maxBudget) query.budget.$lte = Number(maxBudget);
        }

        // Execute query with pagination
        const jobs = await Job.find(query)
            .populate('category', 'name')
            .populate('client', 'name')
            .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        // Get total count for pagination
        const total = await Job.countDocuments(query);

        res.json({
            jobs,
            currentPage: Number(page),
            totalPages: Math.ceil(total / limit),
            totalJobs: total
        });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching jobs' });
    }
});

// Get single job
router.get('/:id', async (req, res) => {
    try {
        const job = await Job.findById(req.params.id)
            .populate('category', 'name')
            .populate('client', 'name')
            .populate('craftsman', 'user profession rating');

        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        res.json(job);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching job' });
    }
});

// Create new job
router.post('/', auth, jobValidationRules(), validate, upload.array('images', 5), async (req, res) => {
    try {
        const jobData = {
            ...req.body,
            client: req.user._id,
            images: req.files ? req.files.map(file => ({
                url: file.path,
                description: file.originalname
            })) : []
        };

        const job = new Job(jobData);
        await job.save();

        // Notify relevant craftsmen
        const craftsmen = await Craftsman.find({
            profession: job.category,
            'serviceArea': job.location.city
        }).populate('user', 'email');

        for (const craftsman of craftsmen) {
            await sendJobNotificationEmail(craftsman.user.email, job);
        }

        res.status(201).json(job);
    } catch (error) {
        res.status(500).json({ error: 'Error creating job' });
    }
});

// Update job
router.put('/:id', auth, jobValidationRules(), validate, async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        // Check if user is the job owner
        if (job.client.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        // Only allow updates if job is not in progress or completed
        if (['in_progress', 'completed'].includes(job.status)) {
            return res.status(400).json({ error: 'Cannot update job in current status' });
        }

        Object.assign(job, req.body);
        await job.save();

        res.json(job);
    } catch (error) {
        res.status(500).json({ error: 'Error updating job' });
    }
});

// Delete job
router.delete('/:id', auth, async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        // Check if user is the job owner
        if (job.client.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        // Only allow deletion if job is not in progress or completed
        if (['in_progress', 'completed'].includes(job.status)) {
            return res.status(400).json({ error: 'Cannot delete job in current status' });
        }

        await job.remove();
        res.json({ message: 'Job deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting job' });
    }
});

// Submit proposal
router.post('/:id/proposals', auth, checkRole(['craftsman']), async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        // Check if job is open
        if (job.status !== 'open') {
            return res.status(400).json({ error: 'Job is not accepting proposals' });
        }

        // Check if craftsman has already submitted a proposal
        const existingProposal = job.proposals.find(
            p => p.craftsman.toString() === req.user._id.toString()
        );

        if (existingProposal) {
            return res.status(400).json({ error: 'Proposal already submitted' });
        }

        const proposal = {
            craftsman: req.user._id,
            price: req.body.price,
            description: req.body.description,
            estimatedDuration: req.body.estimatedDuration
        };

        job.proposals.push(proposal);
        await job.save();

        res.status(201).json(proposal);
    } catch (error) {
        res.status(500).json({ error: 'Error submitting proposal' });
    }
});

// Accept proposal
router.post('/:id/proposals/:proposalId/accept', auth, async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        // Check if user is the job owner
        if (job.client.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const proposal = job.proposals.id(req.params.proposalId);
        
        if (!proposal) {
            return res.status(404).json({ error: 'Proposal not found' });
        }

        // Update job status and assign craftsman
        job.status = 'assigned';
        job.craftsman = proposal.craftsman;
        proposal.status = 'accepted';

        // Reject other proposals
        job.proposals.forEach(p => {
            if (p._id.toString() !== proposal._id.toString()) {
                p.status = 'rejected';
            }
        });

        await job.save();
        res.json(job);
    } catch (error) {
        res.status(500).json({ error: 'Error accepting proposal' });
    }
});

// Update job status
router.patch('/:id/status', auth, async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        // Check if user is authorized (client or assigned craftsman)
        if (job.client.toString() !== req.user._id.toString() && 
            job.craftsman?.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const { status } = req.body;
        
        // Validate status transition
        const validTransitions = {
            'open': ['assigned'],
            'assigned': ['in_progress'],
            'in_progress': ['completed', 'cancelled'],
            'completed': [],
            'cancelled': []
        };

        if (!validTransitions[job.status].includes(status)) {
            return res.status(400).json({ error: 'Invalid status transition' });
        }

        job.status = status;
        await job.save();

        res.json(job);
    } catch (error) {
        res.status(500).json({ error: 'Error updating job status' });
    }
});

module.exports = router; 