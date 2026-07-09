const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
    member: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member',
        required: true
    },
    recordedDate: {
        type: Date,
        default: Date.now
    },
    measurements: {
        weightKg: Number,
        heightCm: Number,
        bmi: Number,
        bodyFatPercentage: Number,
        muscleMassKg: Number,
        chestCm: Number,
        waistCm: Number,
        hipsCm: Number,
        armsCm: Number,
        thighsCm: Number
    },
    vitalStats: {
        restingHeartRate: Number,
        bloodPressure: {
            systolic: Number,
            diastolic: Number
        }
    },
    photos: {
        front: String, // URL
        side: String,
        back: String
    },
    notes: String,
    recordedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Trainer'
    }
}, {
    timestamps: true
});

// Indexes
progressSchema.index({ member: 1, recordedDate: -1 });
progressSchema.index({ recordedDate: -1 });

// Pre-save to calculate BMI
progressSchema.pre('save', function (next) {
    if (this.measurements.heightCm && this.measurements.weightKg) {
        const heightInMeters = this.measurements.heightCm / 100;
        this.measurements.bmi = parseFloat((this.measurements.weightKg / (heightInMeters * heightInMeters)).toFixed(2));
    }
    next();
});

// Static method to get progress history
progressSchema.statics.getProgressHistory = async function (memberId, limit = 10) {
    return await this.find({ member: memberId })
        .sort({ recordedDate: -1 })
        .limit(limit)
        .populate('recordedBy');
};

module.exports = mongoose.model('Progress', progressSchema);