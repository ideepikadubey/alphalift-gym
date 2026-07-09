const Notification = require('../models/Notification');
const { ErrorHandler } = require('../middleware/error');

// @desc    Get all notifications for user
// @route   GET /api/v1/notifications
// @access  Private
exports.getNotifications = async (req, res, next) => {
    try {
        const { limit = 20, unreadOnly = false } = req.query;

        let query = {
            recipient: req.admin.id,
            recipientType: 'Admin'
        };

        if (unreadOnly === 'true') {
            query.isRead = false;
        }

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        const unreadCount = await Notification.countDocuments({
            recipient: req.admin.id,
            recipientType: 'Admin',
            isRead: false
        });

        res.status(200).json({
            success: true,
            count: notifications.length,
            data: {
                notifications,
                unreadCount
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Mark notification as read
// @route   PUT /api/v1/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res, next) => {
    try {
        const notification = await Notification.findOne({
            _id: req.params.id,
            recipient: req.admin.id,
            recipientType: 'Admin'
        });

        if (!notification) {
            return next(new ErrorHandler('Notification not found', 404));
        }

        await notification.markAsRead();

        res.status(200).json({
            success: true,
            message: 'Notification marked as read'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Mark all notifications as read
// @route   PUT /api/v1/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res, next) => {
    try {
        await Notification.updateMany(
            {
                recipient: req.admin.id,
                recipientType: 'Admin',
                isRead: false
            },
            {
                isRead: true,
                readAt: new Date()
            }
        );

        res.status(200).json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete notification
// @route   DELETE /api/v1/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res, next) => {
    try {
        const notification = await Notification.findOneAndDelete({
            _id: req.params.id,
            recipient: req.admin.id,
            recipientType: 'Admin'
        });

        if (!notification) {
            return next(new ErrorHandler('Notification not found', 404));
        }

        res.status(200).json({
            success: true,
            message: 'Notification deleted'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create notification (internal use)
// @route   POST /api/v1/notifications
// @access  Private (Admin)
exports.createNotification = async (req, res, next) => {
    try {
        const { recipient, recipientType, title, message, type, priority, scheduledFor } = req.body;

        const notification = await Notification.create({
            recipient,
            recipientType,
            title,
            message,
            type,
            priority: priority || 'medium',
            scheduledFor: scheduledFor || null,
            sentAt: scheduledFor ? null : new Date()
        });

        res.status(201).json({
            success: true,
            data: notification
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get notification statistics
// @route   GET /api/v1/notifications/stats
// @access  Private
exports.getNotificationStats = async (req, res, next) => {
    try {
        const total = await Notification.countDocuments({
            recipient: req.admin.id,
            recipientType: 'Admin'
        });

        const unread = await Notification.countDocuments({
            recipient: req.admin.id,
            recipientType: 'Admin',
            isRead: false
        });

        const byType = await Notification.aggregate([
            {
                $match: {
                    recipient: req.admin.id,
                    recipientType: 'Admin'
                }
            },
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 },
                    unread: {
                        $sum: { $cond: ['$isRead', 0, 1] }
                    }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: {
                total,
                unread,
                byType
            }
        });
    } catch (error) {
        next(error);
    }
};