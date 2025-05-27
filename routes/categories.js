const express = require('express');
const router = express.Router();
const ServiceCategory = require('../models/ServiceCategory');

// Tüm kategorileri listele
router.get('/', async (req, res) => {
    try {
        const categories = await ServiceCategory.find({ isActive: true })
            .sort('name');
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Kategoriler alınamadı', error: error.message });
    }
});

// Kategori detayı
router.get('/:id', async (req, res) => {
    try {
        const category = await ServiceCategory.findById(req.params.id);
        
        if (!category) {
            return res.status(404).json({ message: 'Kategori bulunamadı' });
        }

        res.json(category);
    } catch (error) {
        res.status(500).json({ message: 'Kategori detayı alınamadı', error: error.message });
    }
});

// Yeni kategori oluştur (Admin)
router.post('/', async (req, res) => {
    try {
        const { name, description, icon, subcategories } = req.body;

        // Kategori adı kontrolü
        const existingCategory = await ServiceCategory.findOne({ name });
        if (existingCategory) {
            return res.status(400).json({ message: 'Bu kategori adı zaten kullanımda' });
        }

        const category = new ServiceCategory({
            name,
            description,
            icon,
            subcategories
        });

        await category.save();
        res.status(201).json(category);
    } catch (error) {
        res.status(500).json({ message: 'Kategori oluşturulamadı', error: error.message });
    }
});

// Kategori güncelle (Admin)
router.put('/:id', async (req, res) => {
    try {
        const category = await ServiceCategory.findById(req.params.id);
        
        if (!category) {
            return res.status(404).json({ message: 'Kategori bulunamadı' });
        }

        // Kategori adı değişiyorsa kontrol et
        if (req.body.name && req.body.name !== category.name) {
            const existingCategory = await ServiceCategory.findOne({ name: req.body.name });
            if (existingCategory) {
                return res.status(400).json({ message: 'Bu kategori adı zaten kullanımda' });
            }
        }

        const updatedCategory = await ServiceCategory.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        res.json(updatedCategory);
    } catch (error) {
        res.status(500).json({ message: 'Kategori güncellenemedi', error: error.message });
    }
});

// Kategori sil (Admin)
router.delete('/:id', async (req, res) => {
    try {
        const category = await ServiceCategory.findById(req.params.id);
        
        if (!category) {
            return res.status(404).json({ message: 'Kategori bulunamadı' });
        }

        // Kategoriyi silmek yerine pasif yap
        category.isActive = false;
        await category.save();

        res.json({ message: 'Kategori başarıyla silindi' });
    } catch (error) {
        res.status(500).json({ message: 'Kategori silinemedi', error: error.message });
    }
});

module.exports = router; 