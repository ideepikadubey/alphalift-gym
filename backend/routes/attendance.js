const express = require('express');
const {
    checkIn,
    checkOut,
    qrScan,
    getTodayAttendance,
    getAllAttendance,
    getMemberAttendance,
    getAttendanceStats,
    updateAttendance,
    deleteAttendance,
    getLiveOccupancy
} = require('../controllers/attendanceController');
const { protect, hasPermission } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

// Live occupancy route (accessible to both staff and members)
router.get('/occupancy', getLiveOccupancy);

// Check-in/Check-out endpoints
router.post('/checkin', hasPermission('canManageMembers'), checkIn);
router.post('/checkout', hasPermission('canManageMembers'), checkOut);
router.post('/qr-scan', hasPermission('canManageMembers'), qrScan);

// Get attendance data
router.get('/today', hasPermission('canViewReports'), getTodayAttendance);
router.get('/stats', hasPermission('canViewReports'), getAttendanceStats);
router.get('/', hasPermission('canViewReports'), getAllAttendance);

// Member-specific attendance
router.get('/member/:memberId', hasPermission('canManageMembers'), getMemberAttendance);

// Update/Delete attendance
router.route('/:id')
    .put(hasPermission('canManageMembers'), updateAttendance)
    .delete(hasPermission('canManageMembers'), deleteAttendance);

module.exports = router;