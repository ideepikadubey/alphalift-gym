const mongoose = require('mongoose');

const chatbotConversationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'userType'
    },
    userType: {
        type: String,
        enum: ['Member', 'Trainer', 'Admin'],
        required: true
    },
    sessionId: {
        type: String,
        required: true,
        index: true
    },
    messages: [{
        role: {
            type: String,
            enum: ['user', 'assistant', 'system'],
            required: true
        },
        content: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    intent: {
        type: String,
        index: true
    },
    entities: mongoose.Schema.Types.Mixed,
    resolved: {
        type: Boolean,
        default: false
    },
    escalatedToHuman: {
        type: Boolean,
        default: false
    },
    feedback: {
        rating: { type: Number, min: 1, max: 5 },
        comment: String
    }
}, {
    timestamps: true
});

// Indexes
chatbotConversationSchema.index({ user: 1, userType: 1, createdAt: -1 });
chatbotConversationSchema.index({ intent: 1, createdAt: -1 });

// Static method to get recent conversations
chatbotConversationSchema.statics.getRecentByUser = async function (userId, userType, limit = 5) {
    return await this.find({
        user: userId,
        userType: userType
    })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('user');
};

module.exports = mongoose.model('ChatbotConversation', chatbotConversationSchema);