const express = require('express');
const {
    getAllTrainers,
    getTrainer,
    createTrainer,
    updateTrainer,
    deleteTrainer,
    assignMember,
    getAssignedMembers,
    getTrainerAvailability,
    updateAvailability,
    getTrainerStats,
    rateTrainer
} = require('../controllers/trainerController');
const { protect, hasPermission } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

// Trainer routes
router.get('/stats', hasPermission('canViewReports'), getTrainerStats);
router.get('/', hasPermission('canManageTrainers'), getAllTrainers);
router.post('/', hasPermission('canManageTrainers'), createTrainer);

// Individual trainer routes
router.route('/:id')
    .get(getTrainer)
    .put(hasPermission('canManageTrainers'), updateTrainer)
    .delete(hasPermission('canManageTrainers'), deleteTrainer);

// Rate a trainer (private for members)
router.post('/:id/rate', rateTrainer);

// Trainer assignments and availability
router.post('/:trainerId/assign-member', hasPermission('canManageMembers'), assignMember);
router.get('/:id/members', hasPermission('canManageMembers'), getAssignedMembers);

router.route('/:id/availability')
    .get(getTrainerAvailability)
    .put(hasPermission('canManageTrainers'), updateAvailability);

module.exports = router;