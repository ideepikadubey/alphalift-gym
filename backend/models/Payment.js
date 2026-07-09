const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    membership: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Membership',
        required: true
    },
    member: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member',
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    paymentDate: {
        type: Date,
        default: Date.now
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'card', 'upi', 'netbanking', 'emi'],
        required: true
    },
    status: {
        type: String,
        enum: ['success', 'pending', 'failed', 'refunded'],
        default: 'pending',
        index: true
    },
    transactionId: {
        type: String,
        unique: true,
        sparse: true
    },
    gatewayResponse: {
        provider: String, // razorpay, paytm, stripe, etc.
        response: mongoose.Schema.Types.Mixed,
        signature: String
    },
    invoice: {
        number: String,
        url: String,
        generated: { type: Boolean, default: false }
    },
    remarks: String,
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    }
}, {
    timestamps: true
});

// Indexes
paymentSchema.index({ member: 1, paymentDate: -1 });
paymentSchema.index({ membership: 1 });
paymentSchema.index({ status: 1, paymentDate: -1 });

// Static method for monthly revenue
paymentSchema.statics.getMonthlyRevenue = async function (year, month) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const result = await this.aggregate([
        {
            $match: {
                status: 'success',
                paymentDate: { $gte: startDate, $lte: endDate }
            }
        },
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: '$amount' },
                count: { $sum: 1 }
            }
        }
    ]);

    return result[0] || { totalRevenue: 0, count: 0 };
};

module.exports = mongoose.model('Payment', paymentSchema);