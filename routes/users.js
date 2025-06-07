const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const User = require('../models/User');
const Craftsman = require('../models/Craftsman');
const { auth } = require('../middleware/auth');

// Profil fotoğrafı için upload ayarları
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Profil bilgilerini getir
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    let craftsman = null;
    if (user.role === 'craftsman') {
      craftsman = await Craftsman.findOne({ user: user._id });
    }
    res.json({
      name: user.name,
      email: user.email,
      phone: user.phone,
      photo: user.photo,
      services: craftsman ? craftsman.services : []
    });
  } catch (error) {
    res.status(500).json({ error: 'Profil bilgisi alınamadı' });
  }
});

// Profil bilgilerini güncelle
router.post('/profile', auth, upload.single('profilePhoto'), async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    const user = await User.findById(req.user._id);
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (password) user.password = password;
    if (req.file) user.photo = '/uploads/' + req.file.filename;
    await user.save();
    // Sadece dükkan kullanıcıları için hizmetler
    if (user.role === 'craftsman') {
      let craftsman = await Craftsman.findOne({ user: user._id });
      if (!craftsman) craftsman = new Craftsman({ user: user._id });
      craftsman.services = Array.isArray(req.body.services) ? req.body.services : [req.body.services].filter(Boolean);
      await craftsman.save();
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Profil güncellenemedi' });
  }
});

module.exports = router; 