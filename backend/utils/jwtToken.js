const jwt = require('jsonwebtoken');

// Create and send token
exports.sendToken = (admin, statusCode, res) => {
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '1d'
    });

    // Options for cookie
    const options = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
    };

    // Return response
    res.status(statusCode).cookie('token', token, options).json({
        success: true,
        token,
        admin: {
            id: admin._id,
            username: admin.username,
            email: admin.email,
            fullName: admin.fullName,
            role: admin.role,
            permissions: admin.permissions
        }
    });
};

// Generate token (for API usage, not sending to client)
exports.generateToken = (adminId) => {
    return jwt.sign({ id: adminId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '1d'
    });
};

// Verify token
exports.verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
};