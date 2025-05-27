const express = require('express');
const router = express.Router();
const Craftsman = require('../models/Craftsman');
const User = require('../models/User');
const { auth, checkRole } = require('../middleware/auth');
const { craftsmanValidationRules, validate } = require('../middleware/validator');
const upload = require('../middleware/upload');

// Get all craftsmen with filters
router.get('/', async (req, res) => {
    try {
        const {
            profession,
            city,
            minRating,
            maxPrice,
            sortBy = 'rating.average',
            sortOrder = 'desc',
            page = 1,
            limit = 10
        } = req.query;

        // Build query
        const query = { isVerified: true };
        if (profession) query.profession = profession;
        if (city) query['serviceArea'] = city;
        if (minRating) query['rating.average'] = { $gte: Number(minRating) };
        if (maxPrice) query.hourlyRate = { $lte: Number(maxPrice) };

        // Execute query with pagination
        const craftsmen = await Craftsman.find(query)
            .populate('user', 'name email phone profileImage')
            .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        // Get total count for pagination
        const total = await Craftsman.countDocuments(query);

        res.json({
            craftsmen,
            currentPage: Number(page),
            totalPages: Math.ceil(total / limit),
            totalCraftsmen: total
        });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching craftsmen' });
    }
});

// Get single craftsman
router.get('/:id', async (req, res) => {
    try {
        const craftsman = await Craftsman.findById(req.params.id)
            .populate('user', 'name email phone profileImage')
            .populate('reviews.user', 'name profileImage');

        if (!craftsman) {
            return res.status(404).json({ error: 'Craftsman not found' });
        }

        res.json(craftsman);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching craftsman' });
    }
});

// Create craftsman profile
router.post('/', auth, checkRole(['user']), craftsmanValidationRules(), validate, upload.array('documents', 5), async (req, res) => {
    try {
        // Check if user already has a craftsman profile
        const existingProfile = await Craftsman.findOne({ user: req.user._id });
        if (existingProfile) {
            return res.status(400).json({ error: 'Craftsman profile already exists' });
        }

        const craftsmanData = {
            ...req.body,
            user: req.user._id,
            verificationDocuments: req.files ? req.files.map(file => ({
                type: file.mimetype,
                name: file.originalname,
                url: file.path,
                date: new Date()
            })) : []
        };

        const craftsman = new Craftsman(craftsmanData);
        await craftsman.save();

        // Update user role
        await User.findByIdAndUpdate(req.user._id, { role: 'craftsman' });

        res.status(201).json(craftsman);
    } catch (error) {
        res.status(500).json({ error: 'Error creating craftsman profile' });
    }
});

// Update craftsman profile
router.put('/:id', auth, checkRole(['craftsman']), craftsmanValidationRules(), validate, async (req, res) => {
    try {
        const craftsman = await Craftsman.findById(req.params.id);
        
        if (!craftsman) {
            return res.status(404).json({ error: 'Craftsman profile not found' });
        }

        // Check if user owns the profile
        if (craftsman.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        Object.assign(craftsman, req.body);
        await craftsman.save();

        res.json(craftsman);
    } catch (error) {
        res.status(500).json({ error: 'Error updating craftsman profile' });
    }
});

// Add review
router.post('/:id/reviews', auth, async (req, res) => {
    try {
        const craftsman = await Craftsman.findById(req.params.id);
        
        if (!craftsman) {
            return res.status(404).json({ error: 'Craftsman not found' });
        }

        // Check if user has already reviewed
        const existingReview = craftsman.reviews.find(
            r => r.user.toString() === req.user._id.toString()
        );

        if (existingReview) {
            return res.status(400).json({ error: 'You have already reviewed this craftsman' });
        }

        const review = {
            user: req.user._id,
            rating: req.body.rating,
            comment: req.body.comment
        };

        craftsman.reviews.push(review);
        craftsman.calculateAverageRating();
        await craftsman.save();

        res.status(201).json(review);
    } catch (error) {
        res.status(500).json({ error: 'Error adding review' });
    }
});

// Update availability
router.patch('/:id/availability', auth, checkRole(['craftsman']), async (req, res) => {
    try {
        const craftsman = await Craftsman.findById(req.params.id);
        
        if (!craftsman) {
            return res.status(404).json({ error: 'Craftsman not found' });
        }

        // Check if user owns the profile
        if (craftsman.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        craftsman.availability = req.body.availability;
        await craftsman.save();

        res.json(craftsman);
    } catch (error) {
        res.status(500).json({ error: 'Error updating availability' });
    }
});

// Add portfolio item
router.post('/:id/portfolio', auth, checkRole(['craftsman']), upload.array('images', 5), async (req, res) => {
    try {
        const craftsman = await Craftsman.findById(req.params.id);
        
        if (!craftsman) {
            return res.status(404).json({ error: 'Craftsman not found' });
        }

        // Check if user owns the profile
        if (craftsman.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const portfolioItem = {
            title: req.body.title,
            description: req.body.description,
            images: req.files ? req.files.map(file => file.path) : [],
            date: new Date()
        };

        craftsman.portfolio.push(portfolioItem);
        await craftsman.save();

        res.status(201).json(portfolioItem);
    } catch (error) {
        res.status(500).json({ error: 'Error adding portfolio item' });
    }
});

// Add certification
router.post('/:id/certifications', auth, checkRole(['craftsman']), upload.single('certificate'), async (req, res) => {
    try {
        const craftsman = await Craftsman.findById(req.params.id);
        
        if (!craftsman) {
            return res.status(404).json({ error: 'Craftsman not found' });
        }

        // Check if user owns the profile
        if (craftsman.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const certification = {
            name: req.body.name,
            issuer: req.body.issuer,
            date: req.body.date,
            imageUrl: req.file ? req.file.path : undefined
        };

        craftsman.certifications.push(certification);
        await craftsman.save();

        res.status(201).json(certification);
    } catch (error) {
        res.status(500).json({ error: 'Error adding certification' });
    }
});

module.exports = router; 