const Payment = require('../models/Payment');
const Membership = require('../models/Membership');
const Member = require('../models/Member');
const { ErrorHandler } = require('../middleware/error');
const { notifyAllAdmins } = require('../services/notificationService');
const crypto = require('crypto');

// @desc    Create payment
// @route   POST /api/v1/payments
// @access  Private (Admin)
exports.createPayment = async (req, res, next) => {
    try {
        const { membershipId, amount, paymentMethod, transactionId, gatewayResponse } = req.body;

        // Verify membership
        const membership = await Membership.findById(membershipId)
            .populate('member');

        if (!membership) {
            return next(new ErrorHandler('Membership not found', 404));
        }

        // Create payment
        const payment = await Payment.create({
            membership: membershipId,
            member: membership.member,
            amount,
            paymentMethod,
            status: 'success',
            transactionId,
            gatewayResponse: gatewayResponse || null,
            paymentDate: new Date(),
            processedBy: req.admin.id
        });

        // Update membership payment status
        membership.payment.status = 'paid';
        membership.payment.paidAt = new Date();
        membership.payment.transactionId = transactionId;
        if (membership.status === 'pending') {
            membership.status = 'active';
        }
        await membership.save();

        // Create notification for all admins
        const memberName = membership.member
            ? `${membership.member.firstName || ''} ${membership.member.lastName || ''}`.trim()
            : 'Member';
        await notifyAllAdmins({
            title: '💰 Payment Received',
            message: `₹${amount.toLocaleString('en-IN')} received from ${memberName} via ${paymentMethod || 'cash'}.`,
            type: 'payment_received',
            priority: 'medium',
            metadata: { paymentId: payment._id, amount, memberName }
        });

        res.status(201).json({
            success: true,
            data: payment
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Process payment (with gateway integration)
// @route   POST /api/v1/payments/process
// @access  Private
exports.processPayment = async (req, res, next) => {
    try {
        const { membershipId, amount, paymentMethod } = req.body;

        // Verify membership
        const membership = await Membership.findById(membershipId)
            .populate('member');

        if (!membership) {
            return next(new ErrorHandler('Membership not found', 404));
        }

        // Simulate payment gateway processing (integrate Razorpay/Paytm/Stripe here)
        const transactionId = `TXN_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

        const payment = await Payment.create({
            membership: membershipId,
            member: membership.member,
            amount,
            paymentMethod,
            paymentDate: new Date(),
            status: 'success',
            transactionId,
            processedBy: req.admin.id
        });

        // Update membership
        membership.payment.status = 'paid';
        membership.payment.paidAt = new Date();
        membership.payment.transactionId = transactionId;
        if (membership.status === 'pending') {
            membership.status = 'active';
        }
        await membership.save();

        // Create notification for admin
        const Notification = require('../models/Notification');
        await Notification.create({
            recipient: req.admin._id,
            recipientType: 'Admin',
            title: 'Payment Processed',
            message: `Payment of ₹${amount} processed successfully for ${membership.member ? membership.member.fullName : 'member'}.`,
            type: 'payment_received',
            priority: 'medium',
            sentAt: new Date()
        });

        res.status(201).json({
            success: true,
            data: payment
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all payments
// @route   GET /api/v1/payments
// @access  Private (Admin)
exports.getAllPayments = async (req, res, next) => {
    try {
        const { memberId, status, startDate, endDate } = req.query;

        let query = {};

        if (memberId) query.member = memberId;
        if (status) query.status = status;

        if (startDate || endDate) {
            query.paymentDate = {};
            if (startDate) query.paymentDate.$gte = new Date(startDate);
            if (endDate) query.paymentDate.$lte = new Date(endDate);
        }

        const total = await Payment.countDocuments(query);

        const page = req.query.page * 1 || 1;
        const limit = req.query.limit * 1 || 10;
        const skip = (page - 1) * limit;

        const payments = await Payment.find(query)
            .populate('member', 'firstName lastName contact.phone')
            .populate('membership', 'plan')
            .sort({ paymentDate: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            success: true,
            total,
            count: payments.length,
            data: payments
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single payment
// @route   GET /api/v1/payments/:id
// @access  Private
exports.getPayment = async (req, res, next) => {
    try {
        const payment = await Payment.findById(req.params.id)
            .populate('member')
            .populate('membership')
            .populate('processedBy', 'fullName email');

        if (!payment) {
            return next(new ErrorHandler('Payment not found', 404));
        }

        res.status(200).json({
            success: true,
            data: payment
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get payment history for member
// @route   GET /api/v1/payments/member/:memberId
// @access  Private
exports.getMemberPayments = async (req, res, next) => {
    try {
        const payments = await Payment.find({ member: req.params.memberId })
            .populate('membership', 'plan status')
            .sort({ paymentDate: -1 });

        const totalPaid = payments
            .filter(p => p.status === 'success')
            .reduce((sum, p) => sum + p.amount, 0);

        res.status(200).json({
            success: true,
            count: payments.length,
            data: {
                payments,
                totalPaid
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get revenue statistics
// @route   GET /api/v1/payments/revenue/stats
// @access  Private (Admin)
exports.getRevenueStats = async (req, res, next) => {
    try {
        const { year, month } = req.query;

        // Current month revenue
        const currentMonth = month || new Date().getMonth() + 1;
        const currentYear = year || new Date().getFullYear();

        const monthlyRevenue = await Payment.getMonthlyRevenue(currentYear, currentMonth);

        // Total revenue
        const totalRevenue = await Payment.aggregate([
            { $match: { status: 'success' } },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Pending payments
        const pendingPayments = await Payment.aggregate([
            { $match: { status: 'pending' } },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' }
                }
            }
        ]);

        // Revenue by payment method
        const revenueByMethod = await Payment.aggregate([
            { $match: { status: 'success' } },
            {
                $group: {
                    _id: '$paymentMethod',
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Monthly trend (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlyTrend = await Payment.aggregate([
            {
                $match: {
                    status: 'success',
                    paymentDate: { $gte: sixMonthsAgo }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$paymentDate' },
                        month: { $month: '$paymentDate' }
                    },
                    revenue: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        res.status(200).json({
            success: true,
            data: {
                currentMonth: {
                    revenue: monthlyRevenue.totalRevenue,
                    transactions: monthlyRevenue.count
                },
                total: totalRevenue[0] || { total: 0, count: 0 },
                pending: pendingPayments[0]?.total || 0,
                byMethod: revenueByMethod,
                monthlyTrend
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Refund payment
// @route   POST /api/v1/payments/:id/refund
// @access  Private (Admin)
exports.refundPayment = async (req, res, next) => {
    try {
        const payment = await Payment.findById(req.params.id);

        if (!payment) {
            return next(new ErrorHandler('Payment not found', 404));
        }

        if (payment.status === 'refunded') {
            return next(new ErrorHandler('Payment already refunded', 400));
        }

        // Implement actual refund logic with payment gateway
        payment.status = 'refunded';
        payment.gatewayResponse = payment.gatewayResponse || {};
        payment.gatewayResponse.refundedAt = new Date();
        payment.gatewayResponse.refundReason = req.body.reason || 'Member request';
        await payment.save();

        // Optionally update membership status
        if (req.body.cancelMembership) {
            const membership = await Membership.findById(payment.membership);
            if (membership) {
                membership.status = 'cancelled';
                membership.cancellationReason = 'Payment refunded';
                await membership.save();
            }
        }

        res.status(200).json({
            success: true,
            message: 'Payment refunded successfully',
            data: payment
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get pending payments
// @route   GET /api/v1/payments/pending
// @access  Private
exports.getPendingPayments = async (req, res, next) => {
    try {
        const payments = await Payment.find({ status: 'pending' })
            .populate('member', 'firstName lastName contact.phone')
            .populate('membership', 'plan status')
            .sort({ paymentDate: -1 });

        const totalPending = payments.reduce((sum, p) => sum + p.amount, 0);

        res.status(200).json({
            success: true,
            count: payments.length,
            data: {
                payments,
                totalPending
            }
        });
    } catch (error) {
        next(error);
    }
};