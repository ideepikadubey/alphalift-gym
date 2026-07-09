const express = require('express');
const {
    createOrder,
    verifyPayment,
    getPaymentStatus,
    createRefund,
    webhook
} = require('../controllers/paymentGatewayController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Protected routes
router.post('/create-order', protect, createOrder);
router.post('/verify', protect, verifyPayment);
router.get('/status/:orderId', protect, getPaymentStatus);
router.post('/refund', protect, createRefund);

// Webhook (public but signature verified)
router.post('/webhook', webhook);

module.exports = router;