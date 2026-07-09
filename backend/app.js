const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const { limiter } = require('./middleware/rateLimiter');
const { errorHandler } = require('./middleware/error');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
    origin: function(origin, callback) {
        const allowed = [
            'http://localhost:3000',
            process.env.FRONTEND_URL
        ].filter(Boolean);
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin || allowed.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// Body parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Data sanitization
app.use(mongoSanitize());

// Prevent parameter pollution
app.use(hpp());

// Rate limiting
app.use('/api', limiter);

// Routes
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/members', require('./routes/members'));
app.use('/api/v1/memberships', require('./routes/memberships'));
app.use('/api/v1/announcements', require('./routes/announcements'));
app.use('/api/v1/plans', require('./routes/plans'));
app.use('/api/v1/attendance', require('./routes/attendance'));
app.use('/api/v1/payments', require('./routes/payments'));
app.use('/api/v1/trainers', require('./routes/trainers'));
app.use('/api/v1/workouts', require('./routes/workouts'));
app.use('/api/v1/diets', require('./routes/diets'));
app.use('/api/v1/progress', require('./routes/progress'));
app.use('/api/v1/notifications', require('./routes/notifications'));
app.use('/api/v1/dashboard', require('./routes/dashboard'));

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Gym ERP API is running',
        timestamp: new Date().toISOString()
    });
});

// Error handler
app.use(errorHandler);

module.exports = app;