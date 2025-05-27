const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const { auth } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Get all conversations for a user
router.get('/conversations', auth, async (req, res) => {
    try {
        const conversations = await Conversation.find({
            participants: req.user._id,
            isActive: true
        })
        .populate('participants', 'name profileImage')
        .populate('job', 'title')
        .populate('lastMessage')
        .sort('-updatedAt');

        res.json(conversations);
    } catch (error) {
        res.status(500).json({ error: 'Konuşmalar alınırken bir hata oluştu' });
    }
});

// Get messages for a conversation
router.get('/conversations/:conversationId', auth, async (req, res) => {
    try {
        const conversation = await Conversation.findById(req.params.conversationId);
        
        if (!conversation) {
            return res.status(404).json({ error: 'Konuşma bulunamadı' });
        }

        // Check if user is a participant
        if (!conversation.participants.includes(req.user._id)) {
            return res.status(403).json({ error: 'Bu konuşmaya erişim izniniz yok' });
        }

        const messages = await Message.find({ conversation: conversation._id })
            .populate('sender', 'name profileImage')
            .sort('createdAt');

        // Reset unread count
        await conversation.resetUnreadCount(req.user._id);

        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: 'Mesajlar alınırken bir hata oluştu' });
    }
});

// Create new conversation
router.post('/conversations', auth, async (req, res) => {
    try {
        const { participantId, jobId } = req.body;

        // Check if conversation already exists
        const existingConversation = await Conversation.findOne({
            participants: { $all: [req.user._id, participantId] },
            job: jobId
        });

        if (existingConversation) {
            return res.status(400).json({ error: 'Bu konuşma zaten mevcut' });
        }

        const conversation = new Conversation({
            participants: [req.user._id, participantId],
            job: jobId
        });

        await conversation.save();

        res.status(201).json(conversation);
    } catch (error) {
        res.status(500).json({ error: 'Konuşma oluşturulurken bir hata oluştu' });
    }
});

// Send message
router.post('/conversations/:conversationId/messages', auth, upload.array('attachments', 5), async (req, res) => {
    try {
        const conversation = await Conversation.findById(req.params.conversationId);
        
        if (!conversation) {
            return res.status(404).json({ error: 'Konuşma bulunamadı' });
        }

        // Check if user is a participant
        if (!conversation.participants.includes(req.user._id)) {
            return res.status(403).json({ error: 'Bu konuşmaya erişim izniniz yok' });
        }

        const message = new Message({
            conversation: conversation._id,
            sender: req.user._id,
            content: req.body.content,
            attachments: req.files ? req.files.map(file => ({
                type: file.mimetype,
                url: file.path,
                name: file.originalname,
                size: file.size
            })) : []
        });

        await message.save();

        // Update conversation
        conversation.lastMessage = message._id;
        await conversation.save();

        // Increment unread count for other participants
        conversation.participants.forEach(participantId => {
            if (participantId.toString() !== req.user._id.toString()) {
                conversation.incrementUnreadCount(participantId);
            }
        });

        // Emit socket event
        req.app.get('io').to(conversation._id.toString()).emit('new message', message);

        res.status(201).json(message);
    } catch (error) {
        res.status(500).json({ error: 'Mesaj gönderilirken bir hata oluştu' });
    }
});

// Mark messages as read
router.patch('/conversations/:conversationId/read', auth, async (req, res) => {
    try {
        const conversation = await Conversation.findById(req.params.conversationId);
        
        if (!conversation) {
            return res.status(404).json({ error: 'Konuşma bulunamadı' });
        }

        // Check if user is a participant
        if (!conversation.participants.includes(req.user._id)) {
            return res.status(403).json({ error: 'Bu konuşmaya erişim izniniz yok' });
        }

        await Message.updateMany(
            {
                conversation: conversation._id,
                sender: { $ne: req.user._id },
                isRead: false
            },
            {
                isRead: true,
                readAt: new Date()
            }
        );

        await conversation.resetUnreadCount(req.user._id);

        res.json({ message: 'Mesajlar okundu olarak işaretlendi' });
    } catch (error) {
        res.status(500).json({ error: 'Mesajlar işaretlenirken bir hata oluştu' });
    }
});

// Delete conversation
router.delete('/conversations/:conversationId', auth, async (req, res) => {
    try {
        const conversation = await Conversation.findById(req.params.conversationId);
        
        if (!conversation) {
            return res.status(404).json({ error: 'Konuşma bulunamadı' });
        }

        // Check if user is a participant
        if (!conversation.participants.includes(req.user._id)) {
            return res.status(403).json({ error: 'Bu konuşmaya erişim izniniz yok' });
        }

        conversation.isActive = false;
        await conversation.save();

        res.json({ message: 'Konuşma silindi' });
    } catch (error) {
        res.status(500).json({ error: 'Konuşma silinirken bir hata oluştu' });
    }
});

module.exports = router; 