const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again after 15 minutes'
    },
    standardHeaders: true,
    skip: (req) => {
        // Skip rate limiting in development mode
        return process.env.NODE_ENV === 'development';
    }
});

// Stricter limit for authentication routes
const authLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1minutes
    max: 20, // Limit each IP to 10 login attempts per 15 minutes
    message: {
        success: false,
        message: 'Too many login attempts from this IP, please try again later'
    },
    standardHeaders: true,
    skip: (req) => {
        // Skip rate limiting in development mode
        return process.env.NODE_ENV === 'development';
    }
});

module.exports = { limiter, authLimiter };