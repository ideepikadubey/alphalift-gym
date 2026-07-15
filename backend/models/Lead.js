const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: 100
    },
    contact: {
        phone: {
            type: String,
            required: [true, 'Phone number is required'],
            trim: true
        },
        email: {
            type: String,
            trim: true,
            lowercase: true
        }
    },
    source: {
        type: String,
        enum: ['google_my_business', 'meta_ads', 'instagram_ads', 'referral', 'walk_in', 'other'],
        default: 'other'
    },
    status: {
        type: String,
        enum: ['new', 'contacted', 'in_progress', 'converted', 'lost'],
        default: 'new'
    },
    notes: {
        type: String,
        trim: true
    },
    followUpDate: {
        type: Date
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        default: null
    }
}, {
    timestamps: true
});

// Indexes for query speed
leadSchema.index({ status: 1 });
leadSchema.index({ source: 1 });
leadSchema.index({ 'contact.phone': 1 });

module.exports = mongoose.model('Lead', leadSchema);
