const express = require('express');
const {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
    getNotificationStats
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

// Notification routes
router.get('/stats', getNotificationStats);
router.get('/', getNotifications);
router.post('/', createNotification);
router.put('/read-all', markAllAsRead);

// Individual notification routes
router.route('/:id')
    .put(markAsRead)
    .delete(deleteNotification);

// Also match frontend's /notifications/:id/read path
router.put('/:id/read', markAsRead);

module.exports = router;