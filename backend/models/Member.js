const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const memberSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
        maxlength: 50
    },
    lastName: {
        type: String,
        trim: true,
        maxlength: 50
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        required: true
    },
    dateOfBirth: {
        type: Date
    },
    contact: {
        phone: {
            type: String,
            required: [true, 'Phone number is required'],
            unique: true,
            match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number']
        },
        email: {
            type: String,
            unique: true,
            sparse: true,
            match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
        },
        emergencyContact: {
            name: String,
            phone: String
        }
    },
    address: {
        street: String,
        city: { type: String, default: 'Jaipur' },
        state: { type: String, default: 'Rajasthan' },
        pincode: String,
        fullAddress: String
    },
    occupation: String,
    annualIncome: Number,
    medicalConditions: [String], // Array of conditions
    fitnessGoals: [{
        type: String,
        enum: ['weight_loss', 'muscle_gain', 'flexibility', 'endurance', 'strength', 'general_fitness']
    }],
    physicalStats: {
        heightCm: { type: Number, min: 0 },
        weightKg: { type: Number, min: 0 },
        bmi: { type: Number },
        bodyFatPercentage: { type: Number, min: 0, max: 100 },
        muscleMassKg: Number
    },
    profilePhoto: {
        type: String, // URL
        default: null
    },
    emergencyConsent: {
        type: Boolean,
        default: false
    },
    termsAccepted: {
        type: Boolean,
        default: true,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    joinedDate: {
        type: Date,
        default: Date.now
    },
    referredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member',
        default: null
    },
    assignedTrainer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Trainer',
        default: null
    },
    password: {
        type: String,
        required: false,
        select: false
    },
    approvalStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'approved',
        index: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
memberSchema.index({ 'contact.phone': 1 });
memberSchema.index({ 'contact.email': 1 });
memberSchema.index({ isActive: 1 });
memberSchema.index({ gender: 1, isActive: 1 });

// Pre-save hook to calculate BMI
memberSchema.pre('save', async function () {
    if (this.physicalStats?.heightCm && this.physicalStats?.weightKg) {
        const heightInMeters = this.physicalStats.heightCm / 100;
        this.physicalStats.bmi = parseFloat(
            (this.physicalStats.weightKg / (heightInMeters * heightInMeters)).toFixed(2)
        );
    }
});

// Pre-save hook to hash password
memberSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    if (this.password) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
});

// Compare password method
memberSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Virtual for full name
memberSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`.trim();
});

// Method to check active membership
memberSchema.methods.hasActiveMembership = async function () {
    const Membership = mongoose.model('Membership');
    const activeMembership = await Membership.findOne({
        member: this._id,
        status: 'active',
        endDate: { $gte: new Date() }
    });
    return !!activeMembership;
};

module.exports = mongoose.model('Member', memberSchema);