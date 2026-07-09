/**
 * Notification Service — Internal helper to create admin notifications
 * for important events like registrations, payments, and system events.
 */
const Notification = require('../models/Notification');
const Admin = require('../models/Admin');

/**
 * Broadcasts a notification to ALL admin accounts.
 * Used for registration requests, payments, etc.
 */
const notifyAllAdmins = async ({ title, message, type, priority = 'medium', metadata = {} }) => {
    try {
        const admins = await Admin.find({}).select('_id').lean();
        if (!admins.length) return;

        const notifications = admins.map(admin => ({
            recipient: admin._id,
            recipientType: 'Admin',
            title,
            message,
            type,
            priority,
            metadata,
            sentAt: new Date(),
        }));

        await Notification.insertMany(notifications);
    } catch (err) {
        // Non-fatal: log error but don't break the main flow
        console.error('[NotificationService] Failed to create admin notifications:', err.message);
    }
};

module.exports = { notifyAllAdmins };
