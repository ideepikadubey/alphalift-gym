const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const Membership = require('../models/Membership');
const { ErrorHandler } = require('../middleware/error');

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// @desc    Create Razorpay order
// @route   POST /api/v1/payment/create-order
// @access  Private (Member or Admin)
exports.createOrder = async (req, res, next) => {
    try {
        const { amount, currency = 'INR', membershipId, receipt } = req.body;

        if (!amount || !membershipId) {
            return next(new ErrorHandler('Amount and membership ID are required', 400));
        }

        // Verify membership exists
        const membership = await Membership.findById(membershipId)
            .populate('member');

        if (!membership) {
            return next(new ErrorHandler('Membership not found', 404));
        }

        // Allow member to pay for their own membership only
        if (req.member) {
            const memberId = req.member._id.toString();
            const membershipMemberId = membership.member?._id?.toString() || membership.member?.toString();
            if (memberId !== membershipMemberId) {
                return next(new ErrorHandler('Not authorized to pay for this membership', 403));
            }
        }

        // Create Razorpay order
        const initiatorId = req.admin?.id || req.member?._id?.toString();
        const options = {
            amount: Math.round(amount * 100), // Convert to paise
            currency,
            receipt: receipt || `receipt_${Date.now()}`,
            notes: {
                membershipId: membership._id.toString(),
                memberId: (membership.member?._id || membership.member).toString(),
                initiatorId
            }
        };

        const order = await razorpay.orders.create(options);

        res.status(200).json({
            success: true,
            data: {
                orderId: order.id,
                amount: order.amount / 100,
                currency: order.currency,
                memberId: membership.member?._id || membership.member,
                memberName: `${membership.member.firstName} ${membership.member.lastName}`,
                memberPhone: membership.member.contact?.phone,
                memberEmail: membership.member.contact?.email
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Verify Razorpay payment
// @route   POST /api/v1/payment/verify
// @access  Private
exports.verifyPayment = async (req, res, next) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, membershipId } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !membershipId) {
            return next(new ErrorHandler('Missing payment details', 400));
        }

        // Verify signature
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return next(new ErrorHandler('Payment verification failed - Invalid signature', 400));
        }

        // Fetch payment details from Razorpay
        const paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);

        if (paymentDetails.status !== 'captured') {
            return next(new ErrorHandler('Payment not captured', 400));
        }

        // Create payment record
        const payment = await Payment.create({
            membership: membershipId,
            member: paymentDetails.notes.memberId,
            amount: paymentDetails.amount / 100,
            paymentMethod: 'razorpay',
            paymentDate: new Date(paymentDetails.created_at * 1000),
            status: 'success',
            transactionId: razorpay_payment_id,
            gatewayResponse: {
                provider: 'razorpay',
                orderId: razorpay_order_id,
                paymentId: razorpay_payment_id,
                signature: razorpay_signature,
                response: paymentDetails,
                verifiedAt: new Date()
            }
        });

        // Update membership
        const membership = await Membership.findById(membershipId);
        membership.payment.status = 'paid';
        membership.payment.paidAt = new Date();
        membership.payment.transactionId = razorpay_payment_id;
        membership.payment.method = 'upi';

        if (membership.status === 'pending') {
            membership.status = 'active';
        }

        if (req.body.autoRenew !== undefined) {
            membership.autoRenew = req.body.autoRenew;
        }

        await membership.save();

        res.status(200).json({
            success: true,
            message: 'Payment verified successfully',
            data: { payment, membership }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Fetch payment status
// @route   GET /api/v1/payment/status/:orderId
// @access  Private
exports.getPaymentStatus = async (req, res, next) => {
    try {
        const order = await razorpay.orders.fetch(req.params.orderId);
        const payments = await razorpay.orders.fetchPayments(req.params.orderId);

        res.status(200).json({
            success: true,
            data: {
                order: {
                    id: order.id,
                    amount: order.amount / 100,
                    currency: order.currency,
                    status: order.status,
                    createdAt: new Date(order.created_at * 1000)
                },
                payments: payments || []
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create refund
// @route   POST /api/v1/payment/refund
// @access  Private (Admin)
exports.createRefund = async (req, res, next) => {
    try {
        const { paymentId, amount, notes } = req.body;

        if (!paymentId) {
            return next(new ErrorHandler('Payment ID is required', 400));
        }

        // Create refund
        const refund = await razorpay.payments.refund(paymentId, {
            amount: amount ? Math.round(amount * 100) : undefined, // Partial refund
            notes: {
                reason: notes || 'Member request',
                adminId: req.admin.id.toString()
            }
        });

        // Update payment record
        const payment = await Payment.findOne({ transactionId: paymentId });

        if (payment) {
            payment.status = 'refunded';
            payment.gatewayResponse.refund = {
                refundId: refund.id,
                amount: refund.amount / 100,
                status: refund.status,
                reason: notes || 'Member request',
                refundedAt: new Date()
            };
            await payment.save();
        }

        res.status(200).json({
            success: true,
            message: 'Refund initiated successfully',
            data: refund
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Webhook for Razorpay events
// @route   POST /api/v1/payment/webhook
// @access  Public (Razorpay webhook)
exports.webhook = async (req, res, next) => {
    try {
        const webhookSignature = req.get('X-Razorpay-Signature');
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
            .update(JSON.stringify(req.body))
            .digest('hex');

        if (webhookSignature !== expectedSignature) {
            return res.status(400).json({
                success: false,
                message: 'Invalid webhook signature'
            });
        }

        const event = req.body;

        // Handle different event types
        switch (event.event) {
            case 'payment.captured':
                console.log('Payment captured:', event.payload.payment.entity.id);
                // Update payment status if needed
                break;

            case 'payment.failed':
                console.log('Payment failed:', event.payload.payment.entity.id);
                // Update payment status
                break;

            case 'refund.processed':
                console.log('Refund processed:', event.payload.refund.entity.id);
                // Update refund status
                break;
        }

        res.status(200).json({
            success: true,
            message: 'Webhook received'
        });
    } catch (error) {
        next(error);
    }
};