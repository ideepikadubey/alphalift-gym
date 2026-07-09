const express = require('express');
const {
    createPayment,
    processPayment,
    getAllPayments,
    getPayment,
    getMemberPayments,
    getRevenueStats,
    refundPayment,
    getPendingPayments
} = require('../controllers/paymentController');
const { protect, hasPermission } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

// Payment routes
router.post('/', hasPermission('canManagePayments'), createPayment);
router.post('/process', hasPermission('canManagePayments'), processPayment);
router.get('/pending', hasPermission('canManagePayments'), getPendingPayments);
router.get('/revenue/stats', hasPermission('canViewReports'), getRevenueStats);
router.get('/', hasPermission('canViewReports'), getAllPayments);

// Member payments
router.get('/member/:memberId', (req, res, next) => {
    if (req.admin) {
        if (req.admin.role === 'superadmin' || (req.admin.permissions && req.admin.permissions.canViewReports)) {
            return next();
        }
        return res.status(403).json({ success: false, message: 'Not authorized to view reports' });
    }
    if (req.member && req.member.id === req.params.memberId) {
        return next();
    }
    return res.status(403).json({ success: false, message: 'Not authorized to view other member payments' });
}, getMemberPayments);

// Single payment routes
router.route('/:id')
    .get(hasPermission('canViewReports'), getPayment)
    .post(hasPermission('canManagePayments'), refundPayment);

module.exports = router;