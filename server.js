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
mongoose.connect('mongodb://localhost:27017/ustakapinda', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// WebSocket connection handling
// Mesajlaşma ve Socket.IO ile ilgili kodlar kaldırıldı

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const craftsmanRoutes = require('./routes/craftsmen');
const jobRoutes = require('./routes/jobs');
const categoryRoutes = require('./routes/categories');
const notificationRoutes = require('./routes/notifications');
const paymentRoutes = require('./routes/payments');
const reviewRoutes = require('./routes/reviews');
const notificationPreferencesRouter = require('./routes/notificationPreferences');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/craftsmen', craftsmanRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notification-preferences', notificationPreferencesRouter);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Statik dosya servisi (public klasörü kaldırıldıktan sonra ana dizindeki index.html'i göstermek için)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Bir hata oluştu',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
