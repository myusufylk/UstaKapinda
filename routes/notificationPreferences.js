const express = require('express');
const router = express.Router();
const NotificationPreference = require('../models/NotificationPreference');
const auth = require('../middleware/auth');

// Bildirim tercihlerini getir
router.get('/', auth, async (req, res) => {
  try {
    let preferences = await NotificationPreference.findOne({ user: req.user.id });
    
    if (!preferences) {
      preferences = await NotificationPreference.createDefault(req.user.id);
    }

    res.json(preferences);
  } catch (error) {
    console.error('Get notification preferences error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Bildirim tercihlerini güncelle
router.put('/', auth, async (req, res) => {
  try {
    const {
      email,
      sms,
      push,
      quietHours,
      language
    } = req.body;

    let preferences = await NotificationPreference.findOne({ user: req.user.id });
    
    if (!preferences) {
      preferences = await NotificationPreference.createDefault(req.user.id);
    }

    if (email) preferences.email = email;
    if (sms) preferences.sms = sms;
    if (push) preferences.push = push;
    if (quietHours) preferences.quietHours = quietHours;
    if (language) preferences.language = language;

    await preferences.save();
    res.json(preferences);
  } catch (error) {
    console.error('Update notification preferences error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Belirli bir kanalın tercihlerini güncelle
router.put('/:channel', auth, async (req, res) => {
  try {
    const { channel } = req.params;
    const { enabled, preferences } = req.body;

    if (!['email', 'sms', 'push'].includes(channel)) {
      return res.status(400).json({ message: 'Geçersiz kanal' });
    }

    let notificationPreferences = await NotificationPreference.findOne({ user: req.user.id });
    
    if (!notificationPreferences) {
      notificationPreferences = await NotificationPreference.createDefault(req.user.id);
    }

    if (enabled !== undefined) {
      notificationPreferences[channel].enabled = enabled;
    }

    if (preferences) {
      notificationPreferences[channel].preferences = {
        ...notificationPreferences[channel].preferences,
        ...preferences
      };
    }

    await notificationPreferences.save();
    res.json(notificationPreferences);
  } catch (error) {
    console.error('Update channel preferences error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Sessiz saatleri güncelle
router.put('/quiet-hours', auth, async (req, res) => {
  try {
    const { enabled, startTime, endTime } = req.body;

    let preferences = await NotificationPreference.findOne({ user: req.user.id });
    
    if (!preferences) {
      preferences = await NotificationPreference.createDefault(req.user.id);
    }

    if (enabled !== undefined) preferences.quietHours.enabled = enabled;
    if (startTime) preferences.quietHours.startTime = startTime;
    if (endTime) preferences.quietHours.endTime = endTime;

    await preferences.save();
    res.json(preferences);
  } catch (error) {
    console.error('Update quiet hours error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Dil tercihini güncelle
router.put('/language', auth, async (req, res) => {
  try {
    const { language } = req.body;

    if (!['tr', 'en'].includes(language)) {
      return res.status(400).json({ message: 'Geçersiz dil' });
    }

    let preferences = await NotificationPreference.findOne({ user: req.user.id });
    
    if (!preferences) {
      preferences = await NotificationPreference.createDefault(req.user.id);
    }

    preferences.language = language;
    await preferences.save();
    res.json(preferences);
  } catch (error) {
    console.error('Update language error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Tüm bildirimleri devre dışı bırak
router.put('/disable-all', auth, async (req, res) => {
  try {
    let preferences = await NotificationPreference.findOne({ user: req.user.id });
    
    if (!preferences) {
      preferences = await NotificationPreference.createDefault(req.user.id);
    }

    preferences.email.enabled = false;
    preferences.sms.enabled = false;
    preferences.push.enabled = false;

    await preferences.save();
    res.json(preferences);
  } catch (error) {
    console.error('Disable all notifications error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Tüm bildirimleri etkinleştir
router.put('/enable-all', auth, async (req, res) => {
  try {
    let preferences = await NotificationPreference.findOne({ user: req.user.id });
    
    if (!preferences) {
      preferences = await NotificationPreference.createDefault(req.user.id);
    }

    preferences.email.enabled = true;
    preferences.sms.enabled = true;
    preferences.push.enabled = true;

    await preferences.save();
    res.json(preferences);
  } catch (error) {
    console.error('Enable all notifications error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router; 