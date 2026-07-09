const express = require('express');
const {
    getAllMembers,
    getMember,
    createMember,
    updateMember,
    deleteMember,
    getMemberStats,
    searchMembers,
    approveMember,
    rejectMember
} = require('../controllers/memberController');
const { protect, hasPermission } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

router.route('/')
    .get(hasPermission('canManageMembers'), getAllMembers)
    .post(hasPermission('canManageMembers'), createMember);

router.get('/stats', hasPermission('canViewReports'), getMemberStats);
router.get('/search', searchMembers);
router.put('/:id/approve', hasPermission('canManageMembers'), approveMember);
router.put('/:id/reject', hasPermission('canManageMembers'), rejectMember);

router.route('/:id')
    .get(getMember)
    .put(hasPermission('canManageMembers'), updateMember)
    .delete(hasPermission('canManageMembers'), deleteMember);

module.exports = router;