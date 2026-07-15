const express = require('express');
const {
    getLeads,
    getLead,
    createLead,
    updateLead,
    deleteLead,
    createLeadExternal
} = require('../controllers/leadController');
const { protect, hasPermission } = require('../middleware/auth');

const router = express.Router();

// Public Webhook route (performs API Key auth internally)
router.post('/external', createLeadExternal);

// All subsequent routes require authentication and permission
router.use(protect);
router.use(hasPermission('canManageMembers'));

router.route('/')
    .get(getLeads)
    .post(createLead);

router.route('/:id')
    .get(getLead)
    .put(updateLead)
    .delete(deleteLead);

module.exports = router;
