const Admin = require('../models/Admin');
const Member = require('../models/Member');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ErrorHandler } = require('../middleware/error');
const { notifyAllAdmins } = require('../services/notificationService');

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '1d'
    });
};

exports.registerAdmin = async (req, res, next) => {
    try {
        const { username, password, email, fullName, role } = req.body;

        // Check if exists
        const existingAdmin = await Admin.findOne({
            $or: [{ username }, { email }]
        });

        if (existingAdmin) {
            return next(new ErrorHandler('Admin already exists', 400));
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create admin
        const admin = await Admin.create({
            username,
            password: hashedPassword,
            email,
            fullName,
            role: role || 'admin'
        });

        // Generate token
        const token = generateToken(admin._id);

        res.status(201).json({
            success: true,
            token,
            admin: {
                _id: admin._id,
                id: admin._id,
                username: admin.username,
                email: admin.email,
                fullName: admin.fullName,
                role: admin.role,
                permissions: admin.permissions
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.loginAdmin = async (req, res, next) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return next(new ErrorHandler('Provide username and password', 400));
        }

        const admin = await Admin.findOne({ username }).select('+password');

        if (!admin) {
            return next(new ErrorHandler('Invalid credentials', 401));
        }

        const isMatch = await admin.comparePassword(password);

        if (!isMatch) {
            return next(new ErrorHandler('Invalid credentials', 401));
        }

        const token = generateToken(admin._id);

        res.status(200).json({
            success: true,
            token,
            admin: {
                _id: admin._id,
                id: admin._id,
                username: admin.username,
                email: admin.email,
                fullName: admin.fullName,
                role: admin.role,
                permissions: admin.permissions
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get currently logged in admin details
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
    try {
        const admin = await Admin.findById(req.admin.id);
        res.status(200).json({
            success: true,
            data: {
                _id: admin._id,
                id: admin._id,
                username: admin.username,
                email: admin.email,
                fullName: admin.fullName,
                role: admin.role,
                permissions: admin.permissions
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.loginMember = async (req, res, next) => {
    try {
        const { phone, password } = req.body;

        if (!phone || !password) {
            return next(new ErrorHandler('Provide phone number and password', 400));
        }

        // Find member by phone and select the password field
        const member = await Member.findOne({ 'contact.phone': phone }).select('+password');

        if (!member) {
            return next(new ErrorHandler('Invalid credentials', 401));
        }

        const isMatch = await member.comparePassword(password);

        if (!isMatch) {
            return next(new ErrorHandler('Invalid credentials', 401));
        }

        const token = generateToken(member._id);

        res.status(200).json({
            success: true,
            token,
            member: {
                _id: member._id,
                id: member._id,
                firstName: member.firstName,
                lastName: member.lastName,
                phone: member.contact?.phone,
                email: member.contact?.email,
                role: 'member',
                assignedTrainer: member.assignedTrainer
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.getMemberMe = async (req, res, next) => {
    try {
        const member = await Member.findById(req.member.id);
        if (!member) {
            return next(new ErrorHandler('Member profile not found', 404));
        }
        res.status(200).json({
            success: true,
            data: {
                _id: member._id,
                id: member._id,
                firstName: member.firstName,
                lastName: member.lastName,
                phone: member.contact?.phone,
                email: member.contact?.email,
                role: 'member',
                assignedTrainer: member.assignedTrainer
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.registerMember = async (req, res, next) => {
    try {
        const { firstName, lastName, gender, dateOfBirth, occupation, contact, address, password } = req.body;

        // Support both flat and nested phone
        const phone = contact?.phone || req.body.phone;
        const email = contact?.email || req.body.email;

        if (!firstName || !phone || !gender || !password) {
            return next(new ErrorHandler('Please provide firstName, phone, gender, and password', 400));
        }

        const existingMember = await Member.findOne({ 'contact.phone': phone });
        if (existingMember) {
            return next(new ErrorHandler('A member with this phone number is already registered', 400));
        }

        const member = new Member({
            firstName,
            lastName: lastName || '',
            gender,
            dateOfBirth: dateOfBirth || undefined,
            occupation: occupation || undefined,
            contact: {
                phone,
                email: email || undefined,
                emergencyContact: contact?.emergencyContact || undefined
            },
            address: address || undefined,
            password,
            approvalStatus: 'pending',
            isActive: false
        });

        await member.save();

        // 🔔 Notify all admins of the new registration request
        await notifyAllAdmins({
            title: '🆕 New Member Registration',
            message: `${firstName} ${lastName || ''} has submitted a registration request (Phone: ${phone}). Review and approve in Members → Pending.`,
            type: 'general',
            priority: 'high',
            metadata: { memberId: member._id, phone }
        });

        res.status(201).json({
            success: true,
            message: 'Registration request submitted successfully. Waiting for admin approval.'
        });
    } catch (error) {
        next(error);
    }
};

exports.updateMe = async (req, res, next) => {
    try {
        if (req.admin) {
            const admin = await Admin.findById(req.admin.id);
            if (!admin) return next(new ErrorHandler('User not found', 404));

            admin.fullName = req.body.fullName || admin.fullName;
            admin.email = req.body.email || admin.email;
            admin.username = req.body.username || admin.username;

            await admin.save();
            return res.status(200).json({
                success: true,
                data: {
                    _id: admin._id,
                    id: admin._id,
                    username: admin.username,
                    email: admin.email,
                    fullName: admin.fullName,
                    role: admin.role,
                    permissions: admin.permissions
                }
            });
        } else if (req.member) {
            const member = await Member.findById(req.member.id);
            if (!member) return next(new ErrorHandler('Member not found', 404));

            member.firstName = req.body.firstName || member.firstName;
            member.lastName = req.body.lastName || member.lastName;
            if (req.body.phone) member.contact.phone = req.body.phone;
            if (req.body.email) member.contact.email = req.body.email;

            await member.save();
            return res.status(200).json({
                success: true,
                data: {
                    _id: member._id,
                    id: member._id,
                    firstName: member.firstName,
                    lastName: member.lastName,
                    phone: member.contact?.phone,
                    email: member.contact?.email,
                    role: 'member'
                }
            });
        } else {
            return next(new ErrorHandler('Not authorized', 401));
        }
    } catch (error) {
        next(error);
    }
};

exports.updatePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return next(new ErrorHandler('Provide current and new password', 400));
        }

        if (req.admin) {
            const admin = await Admin.findById(req.admin.id).select('+password');
            if (!admin) return next(new ErrorHandler('User not found', 404));

            const isMatch = await admin.comparePassword(currentPassword);
            if (!isMatch) {
                return next(new ErrorHandler('Current password is incorrect', 401));
            }

            const salt = await bcrypt.genSalt(10);
            admin.password = await bcrypt.hash(newPassword, salt);
            await admin.save();

            return res.status(200).json({
                success: true,
                message: 'Password updated successfully'
            });
        } else if (req.member) {
            const member = await Member.findById(req.member.id).select('+password');
            if (!member) return next(new ErrorHandler('Member not found', 404));

            const isMatch = await member.comparePassword(currentPassword);
            if (!isMatch) {
                return next(new ErrorHandler('Current password is incorrect', 401));
            }

            member.password = newPassword;
            await member.save();

            return res.status(200).json({
                success: true,
                message: 'Password updated successfully'
            });
        } else {
            return next(new ErrorHandler('Not authorized', 401));
        }
    } catch (error) {
        next(error);
    }
};