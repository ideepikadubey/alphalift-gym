class ErrorHandler extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        Error.captureStackTrace(this, this.constructor);
    }
}

// Handle duplicate key errors
const handleDuplicateFields = (err) => {
    const value = Object.values(err.keyValue)[0];
    const message = `Duplicate value entered: ${value}. Please use another value`;
    return new ErrorHandler(message, 400);
};

// Handle validation errors
const handleValidationError = (err) => {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new ErrorHandler(message, 400);
};

// Handle JWT errors
const handleJWTError = () => {
    return new ErrorHandler('Invalid token. Please login again', 401);
};

const handleJWTExpiredError = () => {
    return new ErrorHandler('Your token has expired. Please login again', 401);
};

// Global error handler
const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.message = err.message || 'Internal Server Error';

    // Mongoose duplicate key
    if (err.code === 11000) {
        err = handleDuplicateFields(err);
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        err = handleValidationError(err);
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        err = handleJWTError();
    }

    if (err.name === 'TokenExpiredError') {
        err = handleJWTExpiredError();
    }

    // Cast error (wrong ID format)
    if (err.name === 'CastError') {
        const message = `Invalid ${err.path}: ${err.value}`;
        err = new ErrorHandler(message, 400);
    }

    // Mongoose connection error
    if (err.code === 'ENOTFOUND') {
        const message = 'Database connection error. Please check your connection string';
        err = new ErrorHandler(message, 500);
    }

    res.status(err.statusCode).json({
        success: false,
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        error: process.env.NODE_ENV === 'development' ? err : undefined
    });
};

module.exports = { ErrorHandler, errorHandler };