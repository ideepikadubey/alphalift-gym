const Trainer = require('../models/Trainer');
const Member = require('../models/Member');
const WorkoutPlan = require('../models/WorkoutPlan');
const DietPlan = require('../models/DietPlan');
const { ErrorHandler } = require('../middleware/error');

// @desc    Get all trainers
// @route   GET /api/v1/trainers
// @access  Private (Admin)
exports.getAllTrainers = async (req, res, next) => {
    try {
        const trainers = await Trainer.find({ isActive: true })
            .sort({ createdAt: -1 });

        const trainersWithStats = await Promise.all(trainers.map(async (trainer) => {
            const count = await Member.countDocuments({
                assignedTrainer: trainer._id,
                isActive: true
            });
            return {
                ...trainer.toObject(),
                assignedMembersCount: count
            };
        }));

        res.status(200).json({
            success: true,
            count: trainersWithStats.length,
            data: trainersWithStats
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single trainer
// @route   GET /api/v1/trainers/:id
// @access  Private
exports.getTrainer = async (req, res, next) => {
    try {
        const trainer = await Trainer.findById(req.params.id);

        if (!trainer) {
            return next(new ErrorHandler('Trainer not found', 404));
        }

        // Get assigned members count
        const assignedMembersCount = await Member.countDocuments({
            assignedTrainer: trainer._id
        });

        // Get workout plans created
        const workoutPlansCount = await WorkoutPlan.countDocuments({
            trainer: trainer._id
        });

        // Get diet plans created
        const dietPlansCount = await DietPlan.countDocuments({
            trainer: trainer._id
        });

        // Check if there is an existing rating by this member
        let memberRating = 0;
        if (req.member) {
            const Rating = require('../models/Rating');
            const ratingRecord = await Rating.findOne({ member: req.member._id, trainer: trainer._id });
            if (ratingRecord) {
                memberRating = ratingRecord.rating;
            }
        }

        res.status(200).json({
            success: true,
            data: {
                trainer,
                memberRating,
                stats: {
                    assignedMembers: assignedMembersCount,
                    workoutPlans: workoutPlansCount,
                    dietPlans: dietPlansCount
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');

// @desc    Create trainer
// @route   POST /api/v1/trainers
// @access  Private (Admin)
exports.createTrainer = async (req, res, next) => {
    try {
        const trainer = await Trainer.create(req.body);

        // Auto-create Admin user account for the trainer to log in via Staff Portal
        const phone = trainer.contact?.phone;
        const email = trainer.contact?.email || `${trainer.firstName.toLowerCase()}.${Date.now()}@alphalift.com`;
        const fullName = `${trainer.firstName} ${trainer.lastName || ''}`.trim();

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('123456', salt);

        await Admin.create({
            username: phone,
            email: email,
            fullName: fullName,
            password: hashedPassword,
            role: 'trainer'
        });

        res.status(201).json({
            success: true,
            data: trainer
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update trainer
// @route   PUT /api/v1/trainers/:id
// @access  Private (Admin)
exports.updateTrainer = async (req, res, next) => {
    try {
        const trainer = await Trainer.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!trainer) {
            return next(new ErrorHandler('Trainer not found', 404));
        }

        res.status(200).json({
            success: true,
            data: trainer
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete trainer (soft delete)
// @route   DELETE /api/v1/trainers/:id
// @access  Private (Admin)
exports.deleteTrainer = async (req, res, next) => {
    try {
        const trainer = await Trainer.findById(req.params.id);

        if (!trainer) {
            return next(new ErrorHandler('Trainer not found', 404));
        }

        trainer.isActive = false;
        await trainer.save();

        res.status(200).json({
            success: true,
            message: 'Trainer deactivated successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Assign trainer to member
// @route   POST /api/v1/trainers/:trainerId/assign-member
// @access  Private
exports.assignMember = async (req, res, next) => {
    try {
        const { memberId } = req.body;

        const trainer = await Trainer.findById(req.params.trainerId);
        if (!trainer) {
            return next(new ErrorHandler('Trainer not found', 404));
        }

        const member = await Member.findById(memberId);
        if (!member) {
            return next(new ErrorHandler('Member not found', 404));
        }

        // Update member's assigned trainer
        member.assignedTrainer = trainer._id;
        await member.save();

        res.status(200).json({
            success: true,
            message: 'Trainer assigned to member successfully',
            data: {
                member,
                trainer
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get trainer's assigned members
// @route   GET /api/v1/trainers/:id/members
// @access  Private
exports.getAssignedMembers = async (req, res, next) => {
    try {
        const trainer = await Trainer.findById(req.params.id);
        if (!trainer) {
            return next(new ErrorHandler('Trainer not found', 404));
        }

        const members = await Member.find({ assignedTrainer: trainer._id, isActive: true })
            .populate('referredBy', 'firstName lastName');

        res.status(200).json({
            success: true,
            count: members.length,
            data: members
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get trainer availability
// @route   GET /api/v1/trainers/:id/availability
// @access  Private
exports.getTrainerAvailability = async (req, res, next) => {
    try {
        const trainer = await Trainer.findById(req.params.id);

        if (!trainer) {
            return next(new ErrorHandler('Trainer not found', 404));
        }

        res.status(200).json({
            success: true,
            data: trainer.availability
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update trainer availability
// @route   PUT /api/v1/trainers/:id/availability
// @access  Private
exports.updateAvailability = async (req, res, next) => {
    try {
        const { availability } = req.body;

        const trainer = await Trainer.findByIdAndUpdate(
            req.params.id,
            { availability },
            {
                new: true,
                runValidators: true
            }
        );

        if (!trainer) {
            return next(new ErrorHandler('Trainer not found', 404));
        }

        res.status(200).json({
            success: true,
            data: trainer
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get trainer statistics
// @route   GET /api/v1/trainers/stats
// @access  Private (Admin)
exports.getTrainerStats = async (req, res, next) => {
    try {
        const totalTrainers = await Trainer.countDocuments({ isActive: true });

        const trainersWithMembers = await Trainer.aggregate([
            { $match: { isActive: true } },
            {
                $lookup: {
                    from: 'members',
                    localField: '_id',
                    foreignField: 'assignedTrainer',
                    as: 'members'
                }
            },
            {
                $project: {
                    fullName: { $concat: ['$firstName', ' ', '$lastName'] },
                    memberCount: { $size: '$members' }
                }
            },
            { $sort: { memberCount: -1 } }
        ]);
        res.status(200).json({
            success: true,
            data: {
                totalTrainers,
                trainersWithMembers
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Rate a trainer
// @route   POST /api/v1/trainers/:id/rate
// @access  Private (Members only)
exports.rateTrainer = async (req, res, next) => {
    try {
        const { rating } = req.body;
        const trainerId = req.params.id;

        // Ensure user is authenticated as a member
        if (!req.member) {
            return next(new ErrorHandler('Only members can rate trainers', 403));
        }

        // Validate rating value
        const ratingVal = Number(rating);
        if (isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
            return next(new ErrorHandler('Rating must be a number between 1 and 5', 400));
        }

        // Ensure member is assigned to this trainer
        if (!req.member.assignedTrainer || req.member.assignedTrainer.toString() !== trainerId) {
            return next(new ErrorHandler('You can only rate your assigned trainer', 403));
        }

        // Verify trainer exists
        const trainer = await Trainer.findById(trainerId);
        if (!trainer) {
            return next(new ErrorHandler('Trainer not found', 404));
        }

        const Rating = require('../models/Rating');

        // Upsert rating
        let ratingRecord = await Rating.findOne({ member: req.member._id, trainer: trainerId });

        if (ratingRecord) {
            ratingRecord.rating = ratingVal;
            await ratingRecord.save();
        } else {
            ratingRecord = await Rating.create({
                member: req.member._id,
                trainer: trainerId,
                rating: ratingVal
            });
        }

        // Fetch updated trainer details to return
        const updatedTrainer = await Trainer.findById(trainerId);

        res.status(200).json({
            success: true,
            message: 'Trainer rated successfully',
            data: updatedTrainer.rating
        });
    } catch (error) {
        next(error);
    }
};