const DietPlan = require('../models/DietPlan');
const Member = require('../models/Member');
const { ErrorHandler } = require('../middleware/error');

// @desc    Get all diet plans
// @route   GET /api/v1/diets
// @access  Private
exports.getAllDiets = async (req, res, next) => {
    try {
        const { planType, isTemplate } = req.query;

        let query = {};

        if (planType) query.planType = planType;
        if (isTemplate !== undefined) query.isTemplate = isTemplate === 'true';

        const diets = await DietPlan.find(query)
            .populate('trainer', 'firstName lastName')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: diets.length,
            data: diets
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single diet plan
// @route   GET /api/v1/diets/:id
// @access  Private
exports.getDiet = async (req, res, next) => {
    try {
        const diet = await DietPlan.findById(req.params.id)
            .populate('trainer', 'firstName lastName')
            .populate('assignedTo.member', 'firstName lastName');

        if (!diet) {
            return next(new ErrorHandler('Diet plan not found', 404));
        }

        res.status(200).json({
            success: true,
            data: diet
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create diet plan
// @route   POST /api/v1/diets
// @access  Private (Trainer/Admin)
exports.createDiet = async (req, res, next) => {
    try {
        const diet = await DietPlan.create({
            ...req.body,
            trainer: req.admin.id
        });

        res.status(201).json({
            success: true,
            data: diet
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update diet plan
// @route   PUT /api/v1/diets/:id
// @access  Private
exports.updateDiet = async (req, res, next) => {
    try {
        const diet = await DietPlan.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!diet) {
            return next(new ErrorHandler('Diet plan not found', 404));
        }

        res.status(200).json({
            success: true,
            data: diet
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete diet plan
// @route   DELETE /api/v1/diets/:id
// @access  Private (Admin)
exports.deleteDiet = async (req, res, next) => {
    try {
        const diet = await DietPlan.findById(req.params.id);

        if (!diet) {
            return next(new ErrorHandler('Diet plan not found', 404));
        }

        await diet.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Diet plan deleted'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Assign diet plan to member
// @route   POST /api/v1/diets/:id/assign
// @access  Private (Trainer)
exports.assignDiet = async (req, res, next) => {
    try {
        const { memberId, startDate, endDate } = req.body;

        const diet = await DietPlan.findById(req.params.id);
        if (!diet) {
            return next(new ErrorHandler('Diet plan not found', 404));
        }

        const member = await Member.findById(memberId);
        if (!member) {
            return next(new ErrorHandler('Member not found', 404));
        }

        // Check if already assigned
        const alreadyAssigned = diet.assignedTo.find(
            a => a.member.toString() === memberId
        );

        if (alreadyAssigned) {
            return next(new ErrorHandler('Diet already assigned to this member', 400));
        }

        diet.assignedTo.push({
            member: memberId,
            assignedDate: new Date(),
            startDate: startDate || new Date(),
            endDate: endDate || null,
            status: 'assigned'
        });

        await diet.save();

        res.status(200).json({
            success: true,
            message: 'Diet plan assigned successfully',
            data: diet
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update member's diet status
// @route   PUT /api/v1/diets/:id/member/:memberId
// @access  Private (Trainer)
exports.updateMemberDietStatus = async (req, res, next) => {
    try {
        const { status, notes } = req.body;

        const diet = await DietPlan.findById(req.params.id);
        if (!diet) {
            return next(new ErrorHandler('Diet plan not found', 404));
        }

        const assignment = diet.assignedTo.find(
            a => a.member.toString() === req.params.memberId
        );

        if (!assignment) {
            return next(new ErrorHandler('Diet not assigned to this member', 404));
        }

        assignment.status = status;
        if (notes) assignment.notes = notes;

        await diet.save();

        res.status(200).json({
            success: true,
            data: diet
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get member's diet plans
// @route   GET /api/v1/diets/member/:memberId
// @access  Private
exports.getMemberDiets = async (req, res, next) => {
    try {
        const diets = await DietPlan.find({
            'assignedTo.member': req.params.memberId
        })
            .populate('trainer', 'firstName lastName')
            .populate('assignedTo.member', 'firstName lastName');

        const memberDiets = diets.map(diet => {
            const memberAssignment = diet.assignedTo.find(
                a => a.member.toString() === req.params.memberId
            );

            return {
                ...diet.toObject(),
                memberAssignment
            };
        });

        res.status(200).json({
            success: true,
            count: memberDiets.length,
            data: memberDiets
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get diet templates
// @route   GET /api/v1/diets/templates
// @access  Private
exports.getDietTemplates = async (req, res, next) => {
    try {
        const { planType } = req.query;

        let query = { isTemplate: true };

        if (planType) query.planType = planType;

        const templates = await DietPlan.find(query)
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

// @desc    Get current logged in member's diet plans
// @route   GET /api/v1/diets/my-diet
// @access  Private (Member)
exports.getMyDiet = async (req, res, next) => {
    try {
        const memberId = req.member?._id || req.admin?._id;
        
        if (!memberId) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized as member'
            });
        }

        const diets = await DietPlan.find({
            'assignedTo.member': memberId
        })
            .populate('trainer', 'firstName lastName')
            .populate('assignedTo.member', 'firstName lastName');

        const memberIdStr = memberId.toString();
        const memberDiets = diets.map(diet => {
            // After populate, a.member is an object — must use _id for comparison
            const memberAssignment = diet.assignedTo.find(
                a => (a.member?._id || a.member)?.toString() === memberIdStr
            );

            return {
                ...diet.toObject(),
                memberAssignment
            };
        });

        res.status(200).json({
            success: true,
            data: memberDiets
        });
    } catch (error) {
        next(error);
    }
};