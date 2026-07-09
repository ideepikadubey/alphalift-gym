const express = require('express');
const {
    getAllDiets,
    getDiet,
    createDiet,
    updateDiet,
    deleteDiet,
    assignDiet,
    updateMemberDietStatus,
    getMemberDiets,
    getDietTemplates
} = require('../controllers/dietController');
const { protect, hasPermission } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

// Diet routes
router.get('/templates', hasPermission('canManageMembers'), getDietTemplates);
router.get('/', hasPermission('canViewReports'), getAllDiets);
router.post('/', hasPermission('canManageMembers'), createDiet);

// Individual diet routes
router.route('/:id')
    .get(getDiet)
    .put(hasPermission('canManageMembers'), updateDiet)
    .delete(hasPermission('canManageMembers'), deleteDiet);

// Diet assignments
router.post('/:id/assign', hasPermission('canManageMembers'), assignDiet);
router.put('/:id/member/:memberId', hasPermission('canManageMembers'), updateMemberDietStatus);

// Member-specific diets
router.get('/member/:memberId', hasPermission('canViewReports'), getMemberDiets);

module.exports = router;