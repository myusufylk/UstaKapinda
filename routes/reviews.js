const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Job = require('../models/Job');
const Craftsman = require('../models/Craftsman');
const { auth } = require('../middleware/auth');
const { reviewValidationRules, validate } = require('../middleware/validator');

// Get reviews for a craftsman
router.get('/craftsman/:craftsmanId', async (req, res) => {
    try {
        const reviews = await Review.find({ craftsman: req.params.craftsmanId })
            .populate('client', 'name profileImage')
            .populate('job', 'title')
            .sort('-createdAt');

        res.json(reviews);
    } catch (error) {
        res.status(500).json({ error: 'Değerlendirmeler alınırken bir hata oluştu' });
    }
});

// Get reviews for a job
router.get('/job/:jobId', async (req, res) => {
    try {
        const reviews = await Review.find({ job: req.params.jobId })
            .populate('client', 'name profileImage')
            .populate('craftsman', 'user profession')
            .sort('-createdAt');

        res.json(reviews);
    } catch (error) {
        res.status(500).json({ error: 'Değerlendirmeler alınırken bir hata oluştu' });
    }
});

// Create review
router.post('/', auth, reviewValidationRules(), validate, async (req, res) => {
    try {
        const { jobId, craftsmanId, rating, comment } = req.body;

        // Check if job exists and is completed
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ error: 'İş bulunamadı' });
        }

        if (job.status !== 'completed') {
            return res.status(400).json({ error: 'Sadece tamamlanmış işler için değerlendirme yapılabilir' });
        }

        // Check if user is the client
        if (job.client.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
        }

        // Check if review already exists
        const existingReview = await Review.findOne({ job: jobId });
        if (existingReview) {
            return res.status(400).json({ error: 'Bu iş için zaten değerlendirme yapılmış' });
        }

        // Create review
        const review = new Review({
            job: jobId,
            craftsman: craftsmanId,
            client: req.user._id,
            rating,
            comment
        });

        await review.save();

        // Update craftsman rating
        const craftsman = await Craftsman.findById(craftsmanId);
        craftsman.reviews.push({
            user: req.user._id,
            rating,
            comment
        });
        craftsman.calculateAverageRating();
        await craftsman.save();

        res.status(201).json(review);
    } catch (error) {
        res.status(500).json({ error: 'Değerlendirme oluşturulurken bir hata oluştu' });
    }
});

// Update review
router.put('/:id', auth, reviewValidationRules(), validate, async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        
        if (!review) {
            return res.status(404).json({ error: 'Değerlendirme bulunamadı' });
        }

        // Check if user is the reviewer
        if (review.client.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
        }

        // Update review
        review.rating = req.body.rating;
        review.comment = req.body.comment;
        await review.save();

        // Update craftsman rating
        const craftsman = await Craftsman.findById(review.craftsman);
        const craftsmanReview = craftsman.reviews.find(
            r => r.user.toString() === req.user._id.toString()
        );
        
        if (craftsmanReview) {
            craftsmanReview.rating = req.body.rating;
            craftsmanReview.comment = req.body.comment;
            craftsman.calculateAverageRating();
            await craftsman.save();
        }

        res.json(review);
    } catch (error) {
        res.status(500).json({ error: 'Değerlendirme güncellenirken bir hata oluştu' });
    }
});

// Delete review
router.delete('/:id', auth, async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        
        if (!review) {
            return res.status(404).json({ error: 'Değerlendirme bulunamadı' });
        }

        // Check if user is the reviewer
        if (review.client.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
        }

        // Remove review from craftsman
        const craftsman = await Craftsman.findById(review.craftsman);
        craftsman.reviews = craftsman.reviews.filter(
            r => r.user.toString() !== req.user._id.toString()
        );
        craftsman.calculateAverageRating();
        await craftsman.save();

        // Delete review
        await review.remove();

        res.json({ message: 'Değerlendirme silindi' });
    } catch (error) {
        res.status(500).json({ error: 'Değerlendirme silinirken bir hata oluştu' });
    }
});

module.exports = router; 