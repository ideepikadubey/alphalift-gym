const express = require('express');
const {
    registerAdmin,
    loginAdmin,
    getMe,
    loginMember,
    getMemberMe,
    registerMember,
    updateMe,
    updatePassword
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public routes - no authentication required
router.post('/register', registerAdmin);
router.post('/login', loginAdmin);
router.post('/member/login', loginMember);
router.post('/member/register', registerMember);

// Private routes
router.get('/me', protect, getMe);
router.get('/member/me', protect, getMemberMe);
router.put('/update/me', protect, updateMe);
router.put('/update/password', protect, updatePassword);

module.exports = router;