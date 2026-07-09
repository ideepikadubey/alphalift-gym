const mongoose = require('mongoose');

const membershipSchema = new mongoose.Schema({
    member: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member',
        required: true
    },
    plan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MembershipPlan',
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'expired', 'cancelled', 'frozen', 'pending'],
        default: 'pending',
        index: true
    },
    payment: {
        status: {
            type: String,
            enum: ['paid', 'pending', 'partial', 'refunded'],
            default: 'pending'
        },
        totalAmount: { type: Number, required: true },
        discountApplied: { type: Number, default: 0 },
        finalAmount: { type: Number, required: true },
        method: {
            type: String,
            enum: ['cash', 'card', 'upi', 'netbanking', 'emi'],
            default: 'cash'
        },
        transactionId: String,
        paidAt: Date
    },
    autoRenew: {
        type: Boolean,
        default: false
    },
    frozenDays: {
        type: Number,
        default: 0
    },
    freezeHistory: [{
        frozenFrom: Date,
        frozenTo: Date,
        reason: String,
        days: Number
    }],
    attendanceCount: {
        type: Number,
        default: 0
    },
    assignedTrainer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Trainer',
        default: null
    },
    enrolledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        default: null
    },
    cancellationReason: String,
    cancelledAt: Date
}, {
    timestamps: true
});

// Indexes
membershipSchema.index({ member: 1, status: 1 });
membershipSchema.index({ plan: 1 });
membershipSchema.index({ startDate: 1, endDate: 1 });
membershipSchema.index({ status: 1, endDate: 1 }); // For expiry reminders

// Pre-save to set default dates
membershipSchema.pre('save', async function () {
    if (this.isModified('payment') && this.payment?.totalAmount != null) {
        if (this.payment.discountApplied != null) {
            this.payment.finalAmount = this.payment.totalAmount - this.payment.discountApplied;
        } else if (this.payment.finalAmount == null) {
            this.payment.finalAmount = this.payment.totalAmount;
        }
    }
});

// Static method to find expiring memberships
membershipSchema.statics.findExpiringSoon = async function (days = 7) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);

    return await this.find({
        status: 'active',
        endDate: { $lte: expiryDate },
        autoRenew: false
    }).populate('member plan');
};

// Method to check if membership is active
membershipSchema.methods.isActive = function () {
    return this.status === 'active' && this.endDate > new Date();
};

// Method to freeze membership
membershipSchema.methods.freeze = async function (days, reason) {
    if (this.status !== 'active') {
        throw new Error('Can only freeze active memberships');
    }

    const freezeFrom = new Date();
    const freezeTo = new Date();
    freezeTo.setDate(freezeTo.getDate() + days);

    this.freezeHistory.push({
        frozenFrom: freezeFrom,
        frozenTo: freezeTo,
        reason: reason || 'Member request',
        days: days
    });

    this.frozenDays += days;
    this.endDate = new Date(this.endDate);
    this.endDate.setDate(this.endDate.getDate() + days);

    await this.save();
    return this;
};

module.exports = mongoose.model('Membership', membershipSchema);