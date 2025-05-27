const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const authRoutes = require('./routes/auth');
const jobRoutes = require('./routes/jobs');
const categoryRoutes = require('./routes/categories');
const ChatMessage = require('./models/ChatMessage');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB bağlantısı
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ustakapinda', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('MongoDB bağlantısı başarılı');
}).catch(err => {
    console.log('MongoDB bağlantı hatası:', err);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/categories', categoryRoutes);

// Tüm GET istekleri için index.html'e yönlendirme
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Socket.IO bağlantı yönetimi
const connectedUsers = new Map();

io.on('connection', (socket) => {
    console.log('Yeni kullanıcı bağlandı:', socket.id);

    // Kullanıcı kimlik doğrulama
    socket.on('authenticate', (userId) => {
        connectedUsers.set(userId, socket.id);
        socket.userId = userId;
    });

    // Mesaj gönderme
    socket.on('sendMessage', async (data) => {
        try {
            const { receiverId, message } = data;
            
            const chatMessage = new ChatMessage({
                sender: socket.userId,
                receiver: receiverId,
                message
            });
            
            await chatMessage.save();

            const receiverSocketId = connectedUsers.get(receiverId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('newMessage', {
                    message: chatMessage,
                    sender: socket.userId
                });
            }
        } catch (error) {
            console.error('Mesaj gönderme hatası:', error);
        }
    });

    // Yazıyor durumu
    socket.on('typing', (data) => {
        const receiverSocketId = connectedUsers.get(data.receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('userTyping', {
                userId: socket.userId,
                isTyping: data.isTyping
            });
        }
    });

    // Bağlantı koptuğunda
    socket.on('disconnect', () => {
        if (socket.userId) {
            connectedUsers.delete(socket.userId);
        }
        console.log('Kullanıcı ayrıldı:', socket.id);
    });
});

// Hata yönetimi
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Bir şeyler yanlış gitti!');
});

// Sunucuyu başlat
const PORT = process.env.PORT || 3000;

function startServer() {
    try {
        server.listen(PORT, () => {
            console.log(`Sunucu ${PORT} portunda çalışıyor`);
        });
    } catch (error) {
        console.error('Sunucu başlatma hatası:', error);
        process.exit(1);
    }
}

// Sunucuyu başlat
startServer();

// Beklenmeyen hataları yakala
process.on('uncaughtException', (error) => {
    console.error('Beklenmeyen hata:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('İşlenmeyen promise reddi:', error);
});

module.exports = app; 