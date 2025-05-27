const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Craftsman = require('../models/Craftsman');

// Kayıt olma
router.post('/register', async (req, res) => {
    try {
        const { email, password, fullName, phoneNumber, userType, address } = req.body;

        // Email kontrolü
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Bu email adresi zaten kullanımda' });
        }

        // Yeni kullanıcı oluştur
        const user = new User({
            email,
            password,
            fullName,
            phoneNumber,
            userType,
            address
        });

        await user.save();

        // Eğer usta ise Craftsman profili oluştur
        if (userType === 'craftsman') {
            const craftsman = new Craftsman({
                userId: user._id,
                profession: req.body.profession || '',
                experience: req.body.experience || 0,
                hourlyRate: req.body.hourlyRate || 0
            });
            await craftsman.save();
        }

        // JWT token oluştur
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        res.status(201).json({
            token,
            user: {
                id: user._id,
                email: user.email,
                fullName: user.fullName,
                userType: user.userType
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Kayıt işlemi başarısız', error: error.message });
    }
});

// Giriş yapma
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Kullanıcıyı bul
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Geçersiz email veya şifre' });
        }

        // Şifreyi kontrol et
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Geçersiz email veya şifre' });
        }

        // JWT token oluştur
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                email: user.email,
                fullName: user.fullName,
                userType: user.userType
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Giriş işlemi başarısız', error: error.message });
    }
});

// Kullanıcı bilgilerini getir
router.get('/me', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Yetkilendirme token\'ı gerekli' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
        }

        let userData = user.toObject();

        // Eğer usta ise Craftsman bilgilerini de getir
        if (user.userType === 'craftsman') {
            const craftsman = await Craftsman.findOne({ userId: user._id });
            if (craftsman) {
                userData.craftsmanProfile = craftsman;
            }
        }

        res.json(userData);
    } catch (error) {
        res.status(500).json({ message: 'Kullanıcı bilgileri alınamadı', error: error.message });
    }
});

module.exports = router; 