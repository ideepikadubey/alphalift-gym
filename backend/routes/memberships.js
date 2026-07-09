const express = require('express');
const {
    getAllMemberships,
    getMembership,
    createMembership,
    updateMembership,
    cancelMembership,
    freezeMembership,
    getExpiringMemberships,
    getMembershipStats,
    getMemberMemberships,
    getMyMembership
} = require('../controllers/membershipController');
const { protect, hasPermission } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/my-membership', getMyMembership);

router.route('/')
    .get(hasPermission('canManageMembers'), getAllMemberships)
    .post(hasPermission('canManageMembers'), createMembership);

router.get('/expiring', hasPermission('canViewReports'), getExpiringMemberships);
router.get('/stats', hasPermission('canViewReports'), getMembershipStats);
router.get('/member/:memberId', hasPermission('canManageMembers'), getMemberMemberships);

router.route('/:id')
    .get(getMembership)
    .put(hasPermission('canManageMembers'), updateMembership)
    .delete(hasPermission('canManageMembers'), cancelMembership);

router.post('/:id/freeze', hasPermission('canManageMembers'), freezeMembership);

module.exports = router;