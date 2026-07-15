const express = require('express');
const { getDashboardStats, globalSearch } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

// Dashboard stats
router.get('/', getDashboardStats);

// Global search
router.get('/search', globalSearch);

module.exports = router;