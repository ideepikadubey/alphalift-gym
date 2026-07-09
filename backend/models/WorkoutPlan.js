const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
    name: { type: String, required: true },
    sets: Number,
    reps: Number,
    duration: String, // e.g., "5 minutes"
    weight: String,   // e.g., "10 kg"
    restTime: String, // e.g., "60 seconds"
    videoUrl: String,
    notes: String,
    order: Number
});

const workoutPlanSchema = new mongoose.Schema({
    trainer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Trainer',
        required: true
    },
    planName: {
        type: String,
        required: true,
        trim: true
    },
    planType: {
        type: String,
        enum: ['weight_loss', 'muscle_gain', 'endurance', 'flexibility', 'strength', 'custom'],
        required: true
    },
    durationWeeks: {
        type: Number,
        default: 4
    },
    difficultyLevel: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'intermediate'
    },
    exercises: [exerciseSchema],
    weeklySchedule: [{
        day: String,
        exercises: [exerciseSchema],
        restDay: { type: Boolean, default: false }
    }],
    isTemplate: {
        type: Boolean,
        default: true
    },
    assignedTo: [{
        member: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Member'
        },
        assignedDate: { type: Date, default: Date.now },
        status: {
            type: String,
            enum: ['assigned', 'in_progress', 'completed', 'cancelled'],
            default: 'assigned'
        }
    }]
}, {
    timestamps: true
});

workoutPlanSchema.index({ trainer: 1 });
workoutPlanSchema.index({ planType: 1, difficultyLevel: 1 });

module.exports = mongoose.model('WorkoutPlan', workoutPlanSchema);