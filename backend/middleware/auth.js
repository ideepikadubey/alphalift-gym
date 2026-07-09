const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Member = require('../models/Member');

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
    try {
        let token;

        // Check for token in Authorization header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        // Check if token exists
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Login required to access this resource'
            });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Find admin by ID from token
            req.admin = await Admin.findById(decoded.id).select('-password');

            if (!req.admin) {
                // Find member by ID from token
                req.member = await Member.findById(decoded.id).select('-password');

                if (!req.member) {
                    return res.status(401).json({
                        success: false,
                        message: 'User not found, token is invalid'
                    });
                }

                // Check if member is active
                if (!req.member.isActive) {
                    return res.status(401).json({
                        success: false,
                        message: 'Your account has been deactivated'
                    });
                }

                return next();
            }

            // Check if admin is active
            if (!req.admin.isActive) {
                return res.status(401).json({
                    success: false,
                    message: 'Your account has been deactivated'
                });
            }

            next();
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token, please login again'
            });
        }
    } catch (error) {
        next(error);
    }
};

// Role-based authorization
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.admin) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
        }

        if (!roles.includes(req.admin.role)) {
            return res.status(403).json({
                success: false,
                message: `Role '${req.admin.role}' is not authorized to access this route`
            });
        }

        next();
    };
};

// Check specific permissions
exports.hasPermission = (permission) => {
    return (req, res, next) => {
        if (!req.admin) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
        }

        // Superadmin has all permissions
        if (req.admin.role === 'superadmin') {
            return next();
        }

        if (!req.admin.permissions || !req.admin.permissions[permission]) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to perform this action'
            });
        }

        next();
    };
};

// Optional authentication (doesn't fail if no token)
exports.optionalAuth = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                req.admin = await Admin.findById(decoded.id).select('-password');
            } catch (error) {
                // Token invalid, but continue without auth
            }
        }

        next();
    } catch (error) {
        next();
    }
};