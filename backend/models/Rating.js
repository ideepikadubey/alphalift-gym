const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
    member: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member',
        required: true
    },
    trainer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Trainer',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    }
}, {
    timestamps: true
});

// Ensure a member can only submit one rating per trainer
ratingSchema.index({ member: 1, trainer: 1 }, { unique: true });

// Static method to calculate average rating and update Trainer model
ratingSchema.statics.calculateAverageRating = async function(trainerId) {
    const stats = await this.aggregate([
        { $match: { trainer: trainerId } },
        {
            $group: {
                _id: '$trainer',
                averageRating: { $avg: '$rating' },
                count: { $sum: 1 }
            }
        }
    ]);

    try {
        if (stats.length > 0) {
            await mongoose.model('Trainer').findByIdAndUpdate(trainerId, {
                'rating.average': Math.round(stats[0].averageRating * 10) / 10,
                'rating.count': stats[0].count
            });
        } else {
            await mongoose.model('Trainer').findByIdAndUpdate(trainerId, {
                'rating.average': 0,
                'rating.count': 0
            });
        }
    } catch (err) {
        console.error('Error calculating average trainer rating:', err);
    }
};

// Recalculate average after save
ratingSchema.post('save', function() {
    this.constructor.calculateAverageRating(this.trainer);
});

// Recalculate average before remove / deleteOne
ratingSchema.post('remove', function() {
    this.constructor.calculateAverageRating(this.trainer);
});

ratingSchema.post('deleteOne', { document: true, query: false }, function() {
    this.constructor.calculateAverageRating(this.trainer);
});

module.exports = mongoose.model('Rating', ratingSchema);
