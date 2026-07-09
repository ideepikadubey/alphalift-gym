const express = require('express');
const {
    sendMessage,
    getConversationHistory,
    getSessionConversation,
    clearHistory,
    getChatbotAnalytics
} = require('../controllers/chatbotController');
const { protect, hasPermission } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

// Chatbot routes
router.post('/message', sendMessage);
router.get('/history', getConversationHistory);
router.get('/session/:sessionId', getSessionConversation);
router.delete('/history', clearHistory);
router.get('/analytics', hasPermission('canViewReports'), getChatbotAnalytics);

module.exports = router;