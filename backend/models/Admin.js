const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const adminSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    fullName: String,
    password: {
        type: String,
        required: true,
        select: false
    },
    role: {
        type: String,
        enum: ['superadmin', 'admin', 'manager', 'receptionist', 'trainer'],
        default: 'admin'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: Date
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

const rolePermissions = {
    superadmin: {
        canManageMembers: true,
        canViewReports: true,
        canManageTrainers: true,
        canManagePlans: true,
        canManagePayments: true
    },
    admin: {
        canManageMembers: true,
        canViewReports: true,
        canManageTrainers: true,
        canManagePlans: true,
        canManagePayments: true
    },
    manager: {
        canManageMembers: true,
        canViewReports: true,
        canManageTrainers: false,
        canManagePlans: true,
        canManagePayments: false
    },
    receptionist: {
        canManageMembers: true,
        canViewReports: false,
        canManageTrainers: false,
        canManagePlans: false,
        canManagePayments: false
    },
    trainer: {
        canManageMembers: true,
        canViewReports: false,
        canManageTrainers: false,
        canManagePlans: false,
        canManagePayments: false
    }
};

// Virtual for permissions mapping
adminSchema.virtual('permissions').get(function () {
    return rolePermissions[this.role] || {
        canManageMembers: false,
        canViewReports: false,
        canManageTrainers: false,
        canManagePlans: false,
        canManagePayments: false
    };
});

// Compare password
adminSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Admin', adminSchema);