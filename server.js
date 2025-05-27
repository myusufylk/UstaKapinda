const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const dotenv = require('dotenv');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const compression = require('compression');
const path = require('path');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: process.env.FRONTEND_URL,
        methods: ['GET', 'POST']
    }
});

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());
app.use(morgan('dev'));
app.use(compression());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// WebSocket connection handling
const connectedUsers = new Map();

io.on('connection', (socket) => {
    console.log('New client connected');

    // Handle user authentication
    socket.on('authenticate', (userId) => {
        connectedUsers.set(userId, socket.id);
        console.log(`User ${userId} authenticated`);
    });

    // Handle private messages
    socket.on('private message', async (data) => {
        const { recipientId, message } = data;
        const recipientSocketId = connectedUsers.get(recipientId);

        if (recipientSocketId) {
            io.to(recipientSocketId).emit('new message', message);
        }
    });

    // Handle typing status
    socket.on('typing', (data) => {
        const { recipientId, isTyping } = data;
        const recipientSocketId = connectedUsers.get(recipientId);

        if (recipientSocketId) {
            io.to(recipientSocketId).emit('user typing', {
                userId: socket.id,
                isTyping
            });
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        for (const [userId, socketId] of connectedUsers.entries()) {
            if (socketId === socket.id) {
                connectedUsers.delete(userId);
                break;
            }
        }
        console.log('Client disconnected');
    });
});

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const craftsmanRoutes = require('./routes/craftsmen');
const jobRoutes = require('./routes/jobs');
const categoryRoutes = require('./routes/categories');
const messageRoutes = require('./routes/messages');
const notificationRoutes = require('./routes/notifications');
const paymentRoutes = require('./routes/payments');
const reviewRoutes = require('./routes/reviews');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/craftsmen', craftsmanRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Bir hata oluştu',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 