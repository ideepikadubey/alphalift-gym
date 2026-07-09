const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'recipientType'
    },
    recipientType: {
        type: String,
        enum: ['Member', 'Trainer', 'Admin'],
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['membership_expiry', 'payment_due', 'payment_received', 'class_reminder',
            'birthday', 'offer', 'workout_assigned', 'diet_assigned', 'system', 'general'],
        required: true,
        index: true
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    isRead: {
        type: Boolean,
        default: false,
        index: true
    },
    readAt: Date,
    actionUrl: String,
    metadata: mongoose.Schema.Types.Mixed,
    scheduledFor: {
        type: Date,
        default: null
    },
    sentVia: {
        inApp: { type: Boolean, default: true },
        email: { type: Boolean, default: false },
        sms: { type: Boolean, default: false },
        whatsapp: { type: Boolean, default: false }
    },
    sentAt: Date
}, {
    timestamps: true
});

// Indexes
notificationSchema.index({ recipient: 1, recipientType: 1, createdAt: -1 });
notificationSchema.index({ type: 1, isRead: 1 });
notificationSchema.index({ scheduledFor: 1 });

// Static method to get unread notifications
notificationSchema.statics.getUnread = async function (userId, userType, limit = 20) {
    return await this.find({
        recipient: userId,
        recipientType: userType,
        isRead: false
    })
        .sort({ createdAt: -1 })
        .limit(limit);
};

// Method to mark as read
notificationSchema.methods.markAsRead = async function () {
    this.isRead = true;
    this.readAt = new Date();
    return await this.save();
};

module.exports = mongoose.model('Notification', notificationSchema);