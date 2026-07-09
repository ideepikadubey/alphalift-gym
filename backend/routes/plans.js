const express = require('express');
const MembershipPlan = require('../models/MembershipPlan');
const { protect, hasPermission } = require('../middleware/auth');
const { ErrorHandler } = require('../middleware/error');

const router = express.Router();

// All routes are protected
router.use(protect);

// @desc    Get all membership plans
// @route   GET /api/v1/plans
// @access  Private
router.get('/', async (req, res, next) => {
    try {
        const { isActive = 'true' } = req.query;

        const plans = await MembershipPlan.find({
            isActive: isActive === 'true'
        }).sort({ price: 1 });

        res.status(200).json({
            success: true,
            count: plans.length,
            data: plans
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Get single plan
// @route   GET /api/v1/plans/:id
// @access  Private
router.get('/:id', async (req, res, next) => {
    try {
        const plan = await MembershipPlan.findById(req.params.id);

        if (!plan) {
            return next(new ErrorHandler('Membership plan not found', 404));
        }

        res.status(200).json({
            success: true,
            data: plan
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Create membership plan
// @route   POST /api/v1/plans
// @access  Private (Admin)
router.post('/', hasPermission('canManagePlans'), async (req, res, next) => {
    try {
        const plan = await MembershipPlan.create(req.body);

        res.status(201).json({
            success: true,
            data: plan
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Update membership plan
// @route   PUT /api/v1/plans/:id
// @access  Private (Admin)
router.put('/:id', hasPermission('canManagePlans'), async (req, res, next) => {
    try {
        const plan = await MembershipPlan.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!plan) {
            return next(new ErrorHandler('Membership plan not found', 404));
        }

        res.status(200).json({
            success: true,
            data: plan
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Delete membership plan
// @route   DELETE /api/v1/plans/:id
// @access  Private (Admin)
router.delete('/:id', hasPermission('canManagePlans'), async (req, res, next) => {
    try {
        const plan = await MembershipPlan.findById(req.params.id);

        if (!plan) {
            return next(new ErrorHandler('Membership plan not found', 404));
        }

        // Soft delete
        plan.isActive = false;
        await plan.save();

        res.status(200).json({
            success: true,
            message: 'Membership plan deactivated'
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;