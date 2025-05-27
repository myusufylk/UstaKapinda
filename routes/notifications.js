const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { auth } = require('../middleware/auth');
const { sendNotificationEmail } = require('../utils/email');

// Get all notifications for a user
router.get('/', auth, async (req, res) => {
    try {
        const notifications = await Notification.find({
            recipient: req.user._id
        })
        .sort('-createdAt')
        .limit(50);

        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: 'Bildirimler alınırken bir hata oluştu' });
    }
});

// Mark notification as read
router.patch('/:id/read', auth, async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        
        if (!notification) {
            return res.status(404).json({ error: 'Bildirim bulunamadı' });
        }

        // Check if user is the recipient
        if (notification.recipient.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Bu bildirime erişim izniniz yok' });
        }

        notification.isRead = true;
        notification.readAt = new Date();
        await notification.save();

        res.json(notification);
    } catch (error) {
        res.status(500).json({ error: 'Bildirim güncellenirken bir hata oluştu' });
    }
});

// Mark all notifications as read
router.patch('/read-all', auth, async (req, res) => {
    try {
        await Notification.updateMany(
            {
                recipient: req.user._id,
                isRead: false
            },
            {
                isRead: true,
                readAt: new Date()
            }
        );

        res.json({ message: 'Tüm bildirimler okundu olarak işaretlendi' });
    } catch (error) {
        res.status(500).json({ error: 'Bildirimler güncellenirken bir hata oluştu' });
    }
});

// Delete notification
router.delete('/:id', auth, async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        
        if (!notification) {
            return res.status(404).json({ error: 'Bildirim bulunamadı' });
        }

        // Check if user is the recipient
        if (notification.recipient.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Bu bildirime erişim izniniz yok' });
        }

        await notification.remove();
        res.json({ message: 'Bildirim silindi' });
    } catch (error) {
        res.status(500).json({ error: 'Bildirim silinirken bir hata oluştu' });
    }
});

// Delete all notifications
router.delete('/', auth, async (req, res) => {
    try {
        await Notification.deleteMany({ recipient: req.user._id });
        res.json({ message: 'Tüm bildirimler silindi' });
    } catch (error) {
        res.status(500).json({ error: 'Bildirimler silinirken bir hata oluştu' });
    }
});

module.exports = router; 