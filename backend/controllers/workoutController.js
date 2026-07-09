const WorkoutPlan = require('../models/WorkoutPlan');
const Member = require('../models/Member');
const { ErrorHandler } = require('../middleware/error');

// @desc    Get all workout plans
// @route   GET /api/v1/workouts
// @access  Private
exports.getAllWorkouts = async (req, res, next) => {
    try {
        const { planType, difficultyLevel, isTemplate } = req.query;

        let query = {};

        if (planType) query.planType = planType;
        if (difficultyLevel) query.difficultyLevel = difficultyLevel;
        if (isTemplate !== undefined) query.isTemplate = isTemplate === 'true';

        const workouts = await WorkoutPlan.find(query)
            .populate('trainer', 'firstName lastName')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: workouts.length,
            data: workouts
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single workout plan
// @route   GET /api/v1/workouts/:id
// @access  Private
exports.getWorkout = async (req, res, next) => {
    try {
        const workout = await WorkoutPlan.findById(req.params.id)
            .populate('trainer', 'firstName lastName')
            .populate('assignedTo.member', 'firstName lastName');

        if (!workout) {
            return next(new ErrorHandler('Workout plan not found', 404));
        }

        res.status(200).json({
            success: true,
            data: workout
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create workout plan
// @route   POST /api/v1/workouts
// @access  Private (Trainer/Admin)
exports.createWorkout = async (req, res, next) => {
    try {
        const workout = await WorkoutPlan.create({
            ...req.body,
            trainer: req.admin.id // Or actual trainer ID if coming from trainer
        });

        res.status(201).json({
            success: true,
            data: workout
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update workout plan
// @route   PUT /api/v1/workouts/:id
// @access  Private
exports.updateWorkout = async (req, res, next) => {
    try {
        const workout = await WorkoutPlan.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!workout) {
            return next(new ErrorHandler('Workout plan not found', 404));
        }

        res.status(200).json({
            success: true,
            data: workout
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete workout plan
// @route   DELETE /api/v1/workouts/:id
// @access  Private (Admin)
exports.deleteWorkout = async (req, res, next) => {
    try {
        const workout = await WorkoutPlan.findById(req.params.id);

        if (!workout) {
            return next(new ErrorHandler('Workout plan not found', 404));
        }

        await workout.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Workout plan deleted'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Assign workout to member
// @route   POST /api/v1/workouts/:id/assign
// @access  Private (Trainer)
exports.assignWorkout = async (req, res, next) => {
    try {
        const { memberId, startDate, endDate } = req.body;

        const workout = await WorkoutPlan.findById(req.params.id);
        if (!workout) {
            return next(new ErrorHandler('Workout plan not found', 404));
        }

        const member = await Member.findById(memberId);
        if (!member) {
            return next(new ErrorHandler('Member not found', 404));
        }

        // Check if already assigned
        const alreadyAssigned = workout.assignedTo.find(
            a => a.member.toString() === memberId
        );

        if (alreadyAssigned) {
            return next(new ErrorHandler('Workout already assigned to this member', 400));
        }

        workout.assignedTo.push({
            member: memberId,
            assignedDate: new Date(),
            startDate: startDate || new Date(),
            endDate: endDate || null,
            status: 'assigned'
        });

        await workout.save();

        res.status(200).json({
            success: true,
            message: 'Workout assigned successfully',
            data: workout
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update member's workout status
// @route   PUT /api/v1/workouts/:id/member/:memberId
// @access  Private (Trainer)
exports.updateMemberWorkoutStatus = async (req, res, next) => {
    try {
        const { status, notes } = req.body;

        const workout = await WorkoutPlan.findById(req.params.id);
        if (!workout) {
            return next(new ErrorHandler('Workout plan not found', 404));
        }

        const assignment = workout.assignedTo.find(
            a => a.member.toString() === req.params.memberId
        );

        if (!assignment) {
            return next(new ErrorHandler('Workout not assigned to this member', 404));
        }

        assignment.status = status;
        if (notes) assignment.notes = notes;

        await workout.save();

        res.status(200).json({
            success: true,
            data: workout
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get member's workout plans
// @route   GET /api/v1/workouts/member/:memberId
// @access  Private
exports.getMemberWorkouts = async (req, res, next) => {
    try {
        const workouts = await WorkoutPlan.find({
            'assignedTo.member': req.params.memberId
        })
            .populate('trainer', 'firstName lastName')
            .populate('assignedTo.member', 'firstName lastName');

        // Filter assignments for this specific member
        const memberWorkouts = workouts.map(workout => {
            const memberAssignment = workout.assignedTo.find(
                a => a.member.toString() === req.params.memberId
            );

            return {
                ...workout.toObject(),
                memberAssignment
            };
        });

        res.status(200).json({
            success: true,
            count: memberWorkouts.length,
            data: memberWorkouts
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get workout templates
// @route   GET /api/v1/workouts/templates
// @access  Private
exports.getWorkoutTemplates = async (req, res, next) => {
    try {
        const { planType, difficultyLevel } = req.query;

        let query = { isTemplate: true };

        if (planType) query.planType = planType;
        if (difficultyLevel) query.difficultyLevel = difficultyLevel;

        const templates = await WorkoutPlan.find(query)
            .populate('trainer', 'firstName lastName');

        res.status(200).json({
            success: true,
            count: templates.length,
            data: templates
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get current logged in member's workout plans
// @route   GET /api/v1/workouts/my-workout
// @access  Private (Member)
exports.getMyWorkout = async (req, res, next) => {
    try {
        const memberId = req.member?._id || req.admin?._id;
        
        if (!memberId) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized as member'
            });
        }

        const workouts = await WorkoutPlan.find({
            'assignedTo.member': memberId
        })
            .populate('trainer', 'firstName lastName')
            .populate('assignedTo.member', 'firstName lastName');

        const memberIdStr = memberId.toString();
        const memberWorkouts = workouts.map(workout => {
            // After populate, a.member is an object — must use _id for comparison
            const memberAssignment = workout.assignedTo.find(
                a => (a.member?._id || a.member)?.toString() === memberIdStr
            );

            return {
                ...workout.toObject(),
                memberAssignment
            };
        });

        res.status(200).json({
            success: true,
            data: memberWorkouts
        });
    } catch (error) {
        next(error);
    }
};