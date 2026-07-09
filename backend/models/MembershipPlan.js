const mongoose = require('mongoose');

const membershipPlanSchema = new mongoose.Schema({
    planName: {
        type: String,
        required: [true, 'Plan name is required'],
        trim: true,
        maxlength: 100
    },
    planType: {
        type: String,
        enum: ['monthly', 'quarterly', 'yearly', 'family', 'corporate'],
        required: true
    },
    durationDays: {
        type: Number,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        default: 'INR'
    },
    accessLevel: {
        type: String,
        enum: ['basic', 'standard', 'premium', 'vip'],
        default: 'standard'
    },
    features: {
        gymAccess: { type: Boolean, default: true },
        personalTrainer: { type: Boolean, default: false },
        dietPlan: { type: Boolean, default: false },
        groupClasses: { type: Boolean, default: false },
        spaAccess: { type: Boolean, default: false },
        lockerAccess: { type: Boolean, default: true }
    },
    maxVisitsPerMonth: {
        type: Number,
        default: null // null = unlimited
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Index for faster queries
membershipPlanSchema.index({ planType: 1, isActive: 1 });

// Virtual for monthly price equivalent
membershipPlanSchema.virtual('monthlyEquivalent').get(function () {
    return this.price / (this.durationDays / 30);
});

module.exports = mongoose.model('MembershipPlan', membershipPlanSchema);