const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    member: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member',
        required: true
    },
    membership: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Membership',
        required: true
    },
    checkIn: {
        time: {
            type: Date,
            required: true,
            default: Date.now
        },
        method: {
            type: String,
            enum: ['qr_code', 'biometric', 'facial_recognition', 'manual'],
            default: 'manual'
        }
    },
    checkOut: {
        time: Date,
        method: {
            type: String,
            enum: ['qr_code', 'biometric', 'facial_recognition', 'manual'],
            default: 'manual'
        }
    },
    session: {
        trainer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Trainer',
            default: null
        },
        type: {
            type: String,
            enum: ['gym', 'cardio', 'yoga', 'zumba', 'personal_training', 'group_class', 'crossfit'],
            default: 'gym'
        },
        durationMinutes: Number
    },
    notes: String
}, {
    timestamps: true
});

// Indexes
attendanceSchema.index({ member: 1, 'checkIn.time': -1 });
attendanceSchema.index({ 'checkIn.time': -1 });
attendanceSchema.index({ membership: 1 });

// Static method for today's attendance
attendanceSchema.statics.getTodayAttendance = async function (memberId = null) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const query = {
        'checkIn.time': { $gte: today, $lt: tomorrow }
    };

    if (memberId) {
        query.member = memberId;
    }

    return await this.find(query).populate('member membership');
};

// Method to calculate duration
attendanceSchema.methods.calculateDuration = function () {
    if (this.checkOut.time && this.checkIn.time) {
        const duration = (this.checkOut.time - this.checkIn.time) / 1000 / 60; // minutes
        this.session.durationMinutes = Math.round(duration);
        return this.session.durationMinutes;
    }
    return null;
};

module.exports = mongoose.model('Attendance', attendanceSchema);