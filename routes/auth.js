const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Shop = require('../models/Shop');
const { auth } = require('../middleware/auth');
const { userValidationRules, shopValidationRules, validate } = require('../middleware/validator');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/email');

// Kullanıcı kaydı
router.post('/register/user', userValidationRules(), validate, async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        // Kullanıcı zaten var mı kontrol et
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Bu e-posta adresi zaten kayıtlı' });
        }

        // Yeni kullanıcı oluştur
        const user = new User({
            name,
            email,
            password,
            phone
        });

        await user.save();

        // Doğrulama tokeni oluştur
        const verificationToken = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Doğrulama e-postası gönder
        await sendVerificationEmail(user.email, verificationToken);

        // Auth token oluştur
        const token = jwt.sign(
            { userId: user._id, type: 'user' },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'Kullanıcı başarıyla kaydedildi',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Kullanıcı kaydı sırasında bir hata oluştu' });
    }
});

// Dükkan kaydı
router.post('/register/shop', shopValidationRules(), validate, async (req, res) => {
    try {
        const { name, email, password, phone, address, services } = req.body;

        // Dükkan zaten var mı kontrol et
        const existingShop = await Shop.findOne({ email });
        if (existingShop) {
            return res.status(400).json({ error: 'Bu e-posta adresi zaten kayıtlı' });
        }

        // Yeni dükkan oluştur
        const shop = new Shop({
            name,
            email,
            password,
            phone,
            address,
            services,
            isVerified: true // Doğrulamayı otomatik olarak true yapıyoruz
        });

        await shop.save();

        // Auth token oluştur
        const token = jwt.sign(
            { shopId: shop._id, type: 'shop' },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'Dükkan başarıyla kaydedildi',
            token,
            shop: {
                id: shop._id,
                name: shop.name,
                email: shop.email
            }
        });
    } catch (error) {
        console.error('Dükkan kaydı hatası:', error);
        res.status(500).json({ error: 'Dükkan kaydı sırasında bir hata oluştu' });
    }
});

// Kullanıcı girişi
router.post('/login/user', async (req, res) => {
    try {
        const { email, password } = req.body;

        // E-posta mı telefon mu kontrolü
        const user = await User.findOne(
            email.includes('@')
                ? { email }
                : { phone: email }
        );
        if (!user) {
            return res.status(401).json({ error: 'Geçersiz kimlik bilgileri' });
        }

        // Şifreyi kontrol et
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Geçersiz kimlik bilgileri' });
        }

        // Token oluştur
        const token = jwt.sign(
            { userId: user._id, type: 'user' },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Giriş sırasında bir hata oluştu' });
    }
});

// Dükkan girişi
router.post('/login/shop', async (req, res) => {
    try {
        const { email, password } = req.body;

        // E-posta mı telefon mu kontrolü
        const shop = await Shop.findOne(
            email.includes('@')
                ? { email }
                : { phone: email }
        );
        if (!shop) {
            return res.status(401).json({ error: 'Geçersiz kimlik bilgileri' });
        }

        // Şifreyi kontrol et
        const isMatch = await shop.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Geçersiz kimlik bilgileri' });
        }

        // Token oluştur
        const token = jwt.sign(
            { shopId: shop._id, type: 'shop' },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            shop: {
                id: shop._id,
                name: shop.name,
                email: shop.email
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Giriş sırasında bir hata oluştu' });
    }
});

// Token doğrulama
router.get('/verify', auth, async (req, res) => {
    try {
        if (req.user.type === 'user') {
            const user = await User.findById(req.user.userId);
            if (!user) {
                return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
            }
            res.json({
                type: 'user',
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            });
        } else if (req.user.type === 'shop') {
            const shop = await Shop.findById(req.user.shopId);
            if (!shop) {
                return res.status(404).json({ error: 'Dükkan bulunamadı' });
            }
            res.json({
                type: 'shop',
                shop: {
                    id: shop._id,
                    name: shop.name,
                    email: shop.email
                }
            });
        }
    } catch (error) {
        res.status(500).json({ error: 'Token doğrulama sırasında bir hata oluştu' });
    }
});

// Get current user
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching user data' });
    }
});

// Request password reset
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Generate reset token
        const resetToken = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        // Send reset email
        await sendPasswordResetEmail(user.email, resetToken);

        res.json({ message: 'Password reset email sent' });
    } catch (error) {
        res.status(500).json({ error: 'Error processing request' });
    }
});

// Reset password
router.post('/reset-password/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user || user.resetPasswordToken !== token) {
            return res.status(400).json({ error: 'Invalid or expired token' });
        }

        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({ message: 'Password reset successful' });
    } catch (error) {
        res.status(400).json({ error: 'Invalid or expired token' });
    }
});

module.exports = router; 