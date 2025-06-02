const express = require('express');
const router = express.Router();
const chatService = require('../services/chatService');
const auth = require('../middleware/auth');

// Aktif sohbetleri getir (sadece destek temsilcileri için)
router.get('/active', auth, async (req, res) => {
    try {
        const chats = await chatService.getActiveChats();
        res.json(chats);
    } catch (error) {
        res.status(500).json({ message: 'Aktif sohbetler alınamadı' });
    }
});

// Sohbet geçmişini getir
router.get('/:chatId', auth, async (req, res) => {
    try {
        const chat = await chatService.getChatHistory(req.params.chatId);
        if (!chat) {
            return res.status(404).json({ message: 'Sohbet bulunamadı' });
        }
        res.json(chat);
    } catch (error) {
        res.status(500).json({ message: 'Sohbet geçmişi alınamadı' });
    }
});

// Destek temsilcisi ata
router.post('/:chatId/assign', auth, async (req, res) => {
    try {
        const { agentId } = req.body;
        const chat = await chatService.assignSupportAgent(req.params.chatId, agentId);
        res.json(chat);
    } catch (error) {
        res.status(500).json({ message: 'Destek temsilcisi atanamadı' });
    }
});

// Sohbeti kapat
router.post('/:chatId/close', auth, async (req, res) => {
    try {
        const chat = await chatService.closeChat(req.params.chatId);
        res.json(chat);
    } catch (error) {
        res.status(500).json({ message: 'Sohbet kapatılamadı' });
    }
});

module.exports = router; 