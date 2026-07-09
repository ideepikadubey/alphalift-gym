const Membership = require('../models/Membership');
const MembershipPlan = require('../models/MembershipPlan');
const Member = require('../models/Member');
const Payment = require('../models/Payment');
const { ErrorHandler } = require('../middleware/error');
const { notifyAllAdmins } = require('../services/notificationService');
const crypto = require('crypto');

// @desc    Get all memberships
// @route   GET /api/v1/memberships
// @access  Private
exports.getAllMemberships = async (req, res, next) => {
    try {
        const { status, expiringSoon, page = 1, limit = 20 } = req.query;
        let query = {};

        if (status) {
            query.status = status;
        }

        if (expiringSoon === 'true') {
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 7);
            query.status = 'active';
            query.endDate = { $lte: expiryDate, $gte: new Date() };
        }

        const total = await Membership.countDocuments(query);

        const memberships = await Membership.find(query)
            .populate('member', 'firstName lastName contact.phone')
            .populate('plan', 'planName planType price')
            .sort({ createdAt: -1 })
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit));

        res.status(200).json({
            success: true,
            total,
            count: memberships.length,
            data: memberships
        });
    } catch (error) {
        next(error);
    }
};


// @desc    Get single membership
// @route   GET /api/v1/memberships/:id
// @access  Private
exports.getMembership = async (req, res, next) => {
    try {
        const membership = await Membership.findById(req.params.id)
            .populate('member')
            .populate('plan')
            .populate('assignedTrainer');

        if (!membership) {
            return next(new ErrorHandler('Membership not found', 404));
        }

        res.status(200).json({
            success: true,
            data: membership
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create membership (enroll member)
// @route   POST /api/v1/memberships
// @access  Private (Admin)
exports.createMembership = async (req, res, next) => {
    try {
        const { member, plan, payment } = req.body;

        // Verify member exists
        const memberExists = await Member.findById(member);
        if (!memberExists) {
            return next(new ErrorHandler('Member not found', 404));
        }

        // Verify plan exists
        const planExists = await MembershipPlan.findById(plan);
        if (!planExists) {
            return next(new ErrorHandler('Membership plan not found', 404));
        }

        // Calculate end date
        const startDate = new Date(req.body.startDate || Date.now());
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + planExists.durationDays);

        const membership = await Membership.create({
            member,
            plan,
            startDate,
            endDate,
            status: payment?.status === 'paid' ? 'active' : 'pending',
            payment: {
                status: payment?.status || 'pending',
                totalAmount: planExists.price,
                discountApplied: payment?.discountApplied || 0,
                finalAmount: payment?.discountApplied
                    ? planExists.price - payment.discountApplied
                    : planExists.price,
                method: payment?.method || 'cash',
                transactionId: payment?.transactionId,
                paidAt: payment?.status === 'paid' ? new Date() : null
            },
            autoRenew: req.body.autoRenew || false,
            enrolledBy: req.admin.id
        });

        // Create a corresponding transaction in the Payment collection
        const finalAmt = payment?.discountApplied
            ? planExists.price - payment.discountApplied
            : planExists.price;
        const transactionId = payment?.transactionId || `TXN_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

        await Payment.create({
            membership: membership._id,
            member,
            amount: finalAmt,
            paymentMethod: payment?.method || 'cash',
            status: payment?.status === 'paid' ? 'success' : 'pending',
            transactionId,
            paymentDate: new Date(),
            processedBy: req.admin.id
        });

        // Also notify on payment if status is paid
        if (payment?.status === 'paid') {
            const memberName = `${memberExists.firstName || ''} ${memberExists.lastName || ''}`.trim();
            await notifyAllAdmins({
                title: '💰 Payment Received',
                message: `₹${finalAmt.toLocaleString('en-IN')} received from ${memberName} for ${planExists.planName || planExists.name} plan (${payment.method || 'cash'}).`,
                type: 'payment_received',
                priority: 'medium',
                metadata: { membershipId: membership._id, amount: finalAmt, memberName }
            });
        }

        res.status(201).json({
            success: true,
            data: membership
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update membership
// @route   PUT /api/v1/memberships/:id
// @access  Private
exports.updateMembership = async (req, res, next) => {
    try {
        const membership = await Membership.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        ).populate('member plan');

        if (!membership) {
            return next(new ErrorHandler('Membership not found', 404));
        }

        res.status(200).json({
            success: true,
            data: membership
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Cancel membership
// @route   DELETE /api/v1/memberships/:id
// @access  Private
exports.cancelMembership = async (req, res, next) => {
    try {
        const membership = await Membership.findById(req.params.id);

        if (!membership) {
            return next(new ErrorHandler('Membership not found', 404));
        }

        membership.status = 'cancelled';
        membership.cancellationReason = req.body.reason || 'Member request';
        membership.cancelledAt = new Date();
        await membership.save();

        res.status(200).json({
            success: true,
            message: 'Membership cancelled successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Freeze membership
// @route   POST /api/v1/memberships/:id/freeze
// @access  Private
exports.freezeMembership = async (req, res, next) => {
    try {
        const membership = await Membership.findById(req.params.id);

        if (!membership) {
            return next(new ErrorHandler('Membership not found', 404));
        }

        if (membership.status !== 'active') {
            return next(new ErrorHandler('Can only freeze active memberships', 400));
        }

        await membership.freeze(req.body.days || 7, req.body.reason);

        res.status(200).json({
            success: true,
            data: membership
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get expiring memberships
// @route   GET /api/v1/memberships/expiring
// @access  Private
exports.getExpiringMemberships = async (req, res, next) => {
    try {
        const days = req.query.days || 7;
        const memberships = await Membership.findExpiringSoon(days);

        res.status(200).json({
            success: true,
            count: memberships.length,
            data: memberships
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get membership statistics
// @route   GET /api/v1/memberships/stats
// @access  Private
exports.getMembershipStats = async (req, res, next) => {
    try {
        const stats = await Membership.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const activeToday = await Membership.countDocuments({
            status: 'active',
            endDate: { $gte: new Date() }
        });

        res.status(200).json({
            success: true,
            data: {
                byStatus: stats,
                activeToday
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get member's memberships
// @route   GET /api/v1/memberships/member/:memberId
// @access  Private
exports.getMemberMemberships = async (req, res, next) => {
    try {
        const memberships = await Membership.find({ member: req.params.memberId })
            .populate('plan')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: memberships.length,
            data: memberships
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get current logged in member's membership details
// @route   GET /api/v1/memberships/my-membership
// @access  Private (Member)
exports.getMyMembership = async (req, res, next) => {
    try {
        const memberId = req.member?.id || req.admin?.id;
        
        if (!memberId) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized as member'
            });
        }

        const membership = await Membership.findOne({ member: memberId, status: 'active' })
            .populate('plan');

        const latest = membership || await Membership.findOne({ member: memberId })
            .sort({ createdAt: -1 })
            .populate('plan');

        res.status(200).json({
            success: true,
            data: latest
        });
    } catch (error) {
        next(error);
    }
};