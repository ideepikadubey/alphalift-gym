const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Broadcast title is required'],
        trim: true
    },
    content: {
        type: String,
        required: [true, 'Broadcast content is required']
    },
    channels: [{
        type: String,
        enum: ['portal', 'whatsapp'],
        default: 'portal'
    }],
    targetAudience: {
        type: String,
        enum: ['all', 'members', 'trainers', 'expiring'],
        default: 'all'
    },
    sentBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Announcement', announcementSchema);
