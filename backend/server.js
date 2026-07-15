require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

const app = require('./app');
const connectDB = require('./config/database');

console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('MONGODB_URI:', process.env.MONGODB_URI);
console.log('JWT_SECRET loaded:', !!process.env.JWT_SECRET);

// Connect to database (single call — app.js no longer calls connectDB)
connectDB();

const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    // console.log(`API Base URL: http://localhost:${PORT}/health`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.log(`Error: ${err.message}`);
    server.close(() => {
        process.exit(1);
    });
});
console.log('JWT_SECRET loaded:', !!process.env.JWT_SECRET);

module.exports = server;