const express = require('express');
const {
    getAllWorkouts,
    getWorkout,
    createWorkout,
    updateWorkout,
    deleteWorkout,
    assignWorkout,
    updateMemberWorkoutStatus,
    getMemberWorkouts,
    getWorkoutTemplates,
    getMyWorkout
} = require('../controllers/workoutController');
const { protect, hasPermission } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

router.get('/my-workout', getMyWorkout);

// Workout routes
router.get('/templates', hasPermission('canManageMembers'), getWorkoutTemplates);
router.get('/', hasPermission('canViewReports'), getAllWorkouts);
router.post('/', hasPermission('canManageMembers'), createWorkout);

// Individual workout routes
router.route('/:id')
    .get(getWorkout)
    .put(hasPermission('canManageMembers'), updateWorkout)
    .delete(hasPermission('canManageMembers'), deleteWorkout);

// Workout assignments
router.post('/:id/assign', hasPermission('canManageMembers'), assignWorkout);
router.put('/:id/member/:memberId', hasPermission('canManageMembers'), updateMemberWorkoutStatus);

// Member-specific workouts
router.get('/member/:memberId', hasPermission('canViewReports'), getMemberWorkouts);

module.exports = router;