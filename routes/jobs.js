const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const User = require('../models/User');
const Craftsman = require('../models/Craftsman');

// Middleware - Token doğrulama
const auth = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Yetkilendirme token\'ı gerekli' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const user = await User.findById(decoded.userId);
        
        if (!user) {
            return res.status(401).json({ message: 'Geçersiz token' });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Yetkilendirme hatası' });
    }
};

// Yeni ilan oluştur
router.post('/', auth, async (req, res) => {
    try {
        const {
            title,
            description,
            category,
            subcategory,
            location,
            address,
            budget,
            deadline,
            images
        } = req.body;

        const job = new Job({
            title,
            description,
            category,
            subcategory,
            customer: req.user._id,
            location,
            address,
            budget,
            deadline,
            images
        });

        await job.save();
        res.status(201).json(job);
    } catch (error) {
        res.status(500).json({ message: 'İlan oluşturulamadı', error: error.message });
    }
});

// İlanları listele
router.get('/', async (req, res) => {
    try {
        const {
            category,
            subcategory,
            status,
            minBudget,
            maxBudget,
            location,
            radius
        } = req.query;

        let query = {};

        if (category) query.category = category;
        if (subcategory) query.subcategory = subcategory;
        if (status) query.status = status;
        if (minBudget || maxBudget) {
            query.budget = {};
            if (minBudget) query.budget.$gte = minBudget;
            if (maxBudget) query.budget.$lte = maxBudget;
        }

        // Konum bazlı arama
        if (location && radius) {
            query.location = {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: location.split(',').map(Number)
                    },
                    $maxDistance: radius * 1000 // metre cinsinden
                }
            };
        }

        const jobs = await Job.find(query)
            .populate('customer', 'fullName rating')
            .populate('craftsman', 'fullName rating')
            .sort('-createdAt');

        res.json(jobs);
    } catch (error) {
        res.status(500).json({ message: 'İlanlar alınamadı', error: error.message });
    }
});

// İlan detayı
router.get('/:id', async (req, res) => {
    try {
        const job = await Job.findById(req.params.id)
            .populate('customer', 'fullName rating')
            .populate('craftsman', 'fullName rating')
            .populate('category', 'name');

        if (!job) {
            return res.status(404).json({ message: 'İlan bulunamadı' });
        }

        res.json(job);
    } catch (error) {
        res.status(500).json({ message: 'İlan detayı alınamadı', error: error.message });
    }
});

// İlan güncelle
router.put('/:id', auth, async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({ message: 'İlan bulunamadı' });
        }

        // Sadece ilan sahibi güncelleyebilir
        if (job.customer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
        }

        // Sadece açık ilanlar güncellenebilir
        if (job.status !== 'open') {
            return res.status(400).json({ message: 'Bu ilan artık güncellenemez' });
        }

        const updatedJob = await Job.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        res.json(updatedJob);
    } catch (error) {
        res.status(500).json({ message: 'İlan güncellenemedi', error: error.message });
    }
});

// İlan sil
router.delete('/:id', auth, async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({ message: 'İlan bulunamadı' });
        }

        // Sadece ilan sahibi silebilir
        if (job.customer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
        }

        // Sadece açık ilanlar silinebilir
        if (job.status !== 'open') {
            return res.status(400).json({ message: 'Bu ilan artık silinemez' });
        }

        await job.remove();
        res.json({ message: 'İlan başarıyla silindi' });
    } catch (error) {
        res.status(500).json({ message: 'İlan silinemedi', error: error.message });
    }
});

// Teklif ver
router.post('/:id/proposals', auth, async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({ message: 'İlan bulunamadı' });
        }

        // Sadece ustalar teklif verebilir
        if (req.user.userType !== 'craftsman') {
            return res.status(403).json({ message: 'Sadece ustalar teklif verebilir' });
        }

        // İlan sahibi kendine teklif veremez
        if (job.customer.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'Kendi ilanınıza teklif veremezsiniz' });
        }

        // Sadece açık ilanlara teklif verilebilir
        if (job.status !== 'open') {
            return res.status(400).json({ message: 'Bu ilana artık teklif verilemez' });
        }

        // Daha önce teklif verilmiş mi kontrol et
        const existingProposal = job.proposals.find(
            p => p.craftsman.toString() === req.user._id.toString()
        );

        if (existingProposal) {
            return res.status(400).json({ message: 'Bu ilana zaten teklif verdiniz' });
        }

        const { price, description, estimatedTime } = req.body;

        job.proposals.push({
            craftsman: req.user._id,
            price,
            description,
            estimatedTime
        });

        await job.save();
        res.status(201).json(job);
    } catch (error) {
        res.status(500).json({ message: 'Teklif verilemedi', error: error.message });
    }
});

module.exports = router; 