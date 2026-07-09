const mongoose = require('mongoose');

const trainerSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        trim: true
    },
    contact: {
        phone: {
            type: String,
            required: true,
            unique: true,
            match: [/^[6-9]\d{9}$/, 'Please enter a valid mobile number']
        },
        email: {
            type: String,
            unique: true,
            sparse: true,
            match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
        }
    },
    specialization: [String],
    certifications: [String],
    experienceYears: {
        type: Number,
        default: 0
    },
    hourlyRate: {
        type: Number,
        default: 0
    },
    availability: {
        days: [{
            day: {
                type: String,
                enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
            },
            slots: [{
                startTime: String, // "09:00"
                endTime: String    // "17:00"
            }]
        }],
        isAvailable: {
            type: Boolean,
            default: true
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    joinedDate: {
        type: Date,
        default: Date.now
    },
    profilePhoto: String,
    rating: {
        average: { type: Number, default: 0, min: 0, max: 5 },
        count: { type: Number, default: 0 }
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
trainerSchema.index({ 'contact.phone': 1 });
trainerSchema.index({ isActive: 1 });

// Virtual for full name
trainerSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`.trim();
});

module.exports = mongoose.model('Trainer', trainerSchema);