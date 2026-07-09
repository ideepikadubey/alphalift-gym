const mongoose = require('mongoose');

const mealSchema = new mongoose.Schema({
    mealType: {
        type: String,
        enum: ['breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout']
    },
    items: [{
        name: String,
        quantity: String,
        calories: Number,
        protein: Number,
        carbs: Number,
        fat: Number
    }],
    totalCalories: Number,
    notes: String
});

const dietPlanSchema = new mongoose.Schema({
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
        enum: ['weight_loss', 'muscle_gain', 'maintenance', 'keto', 'vegan', 'custom'],
        required: true
    },
    nutritionTargets: {
        dailyCalories: Number,
        protein: { grams: Number, percentage: Number },
        carbs: { grams: Number, percentage: Number },
        fat: { grams: Number, percentage: Number },
        fiber: { grams: Number },
        water: { liters: Number }
    },
    meals: [mealSchema],
    supplements: [{
        name: String,
        dosage: String,
        timing: String,
        notes: String
    }],
    restrictions: [String], // allergies, dietary restrictions
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

dietPlanSchema.index({ trainer: 1 });
dietPlanSchema.index({ planType: 1 });

module.exports = mongoose.model('DietPlan', dietPlanSchema);