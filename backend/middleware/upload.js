const multer = require('multer');
const path = require('path');
const { ErrorHandler } = require('./error');

// File filter
const fileFilter = (req, file, cb) => {
    const allowedTypes = {
        'image/': true,
        'application/pdf': true,
        'application/msword': true,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': true,
        'video/': true
    };

    const mimeType = file.mimetype;
    const isAllowed = Object.keys(allowedTypes).some(type => mimeType.startsWith(type));

    if (isAllowed) {
        cb(null, true);
    } else {
        cb(new ErrorHandler('Invalid file type. Only images, PDFs, Word docs, and videos are allowed', 400), false);
    }
};

// Multer configuration
const storage = multer.memoryStorage();

exports.upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
        files: 5 // Max 5 files per request
    }
});

// File type validation middleware
exports.validateFileType = (allowedTypes) => {
    return (req, res, next) => {
        if (!req.files || req.files.length === 0) {
            return next(new ErrorHandler('No file uploaded', 400));
        }

        const invalidFiles = req.files.filter(file => {
            return !allowedTypes.includes(file.mimetype.split('/')[1]);
        });

        if (invalidFiles.length > 0) {
            return next(new ErrorHandler(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`, 400));
        }

        next();
    };
};

// Error handling wrapper for multer
exports.handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return next(new ErrorHandler('File size too large. Maximum size is 10MB', 400));
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return next(new ErrorHandler('Too many files uploaded. Maximum is 5 files', 400));
        }
        return next(new ErrorHandler(`Multer error: ${err.message}`, 400));
    }
    next(err);
};