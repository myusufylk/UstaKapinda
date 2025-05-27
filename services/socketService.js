const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');

class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map();
  }

  initialize(server) {
    this.io = socketIO(server, {
      cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        methods: ['GET', 'POST']
      }
    });

    // Kimlik doğrulama middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication error'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded;
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });

    this.io.on('connection', (socket) => {
      console.log('User connected:', socket.user.id);
      this.connectedUsers.set(socket.user.id, socket.id);

      // Kullanıcı çevrimiçi durumunu güncelle
      this.updateUserStatus(socket.user.id, true);

      // Özel oda oluştur
      socket.join(`user:${socket.user.id}`);

      // Bağlantı koptuğunda
      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.user.id);
        this.connectedUsers.delete(socket.user.id);
        this.updateUserStatus(socket.user.id, false);
      });

      // Mesaj gönderme
      socket.on('send_message', async (data) => {
        const { recipientId, message } = data;
        const recipientSocketId = this.connectedUsers.get(recipientId);

        if (recipientSocketId) {
          this.io.to(recipientSocketId).emit('new_message', {
            senderId: socket.user.id,
            message
          });
        }

        // Mesajı veritabanına kaydet
        try {
          const ChatMessage = require('../models/ChatMessage');
          await ChatMessage.create({
            sender: socket.user.id,
            recipient: recipientId,
            content: message
          });
        } catch (error) {
          console.error('Message save error:', error);
        }
      });

      // Bildirim gönderme
      socket.on('send_notification', (data) => {
        const { recipientId, notification } = data;
        const recipientSocketId = this.connectedUsers.get(recipientId);

        if (recipientSocketId) {
          this.io.to(recipientSocketId).emit('new_notification', {
            ...notification,
            senderId: socket.user.id
          });
        }
      });

      // Yazıyor durumu
      socket.on('typing', (data) => {
        const { recipientId, isTyping } = data;
        const recipientSocketId = this.connectedUsers.get(recipientId);

        if (recipientSocketId) {
          this.io.to(recipientSocketId).emit('user_typing', {
            userId: socket.user.id,
            isTyping
          });
        }
      });
    });
  }

  // Kullanıcı durumunu güncelle
  async updateUserStatus(userId, isOnline) {
    try {
      const User = require('../models/User');
      await User.findByIdAndUpdate(userId, {
        isOnline,
        lastSeen: isOnline ? undefined : new Date()
      });
    } catch (error) {
      console.error('Status update error:', error);
    }
  }

  // Belirli bir kullanıcıya bildirim gönder
  sendNotification(userId, notification) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit('new_notification', notification);
    }
  }

  // Tüm kullanıcılara bildirim gönder
  broadcastNotification(notification) {
    this.io.emit('broadcast_notification', notification);
  }

  // Belirli bir odaya bildirim gönder
  sendToRoom(room, notification) {
    this.io.to(room).emit('room_notification', notification);
  }
}

module.exports = new SocketService(); 