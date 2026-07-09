const express = require('express');
const {
    createAnnouncement,
    getAnnouncements,
    deleteAnnouncement
} = require('../controllers/announcementController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/', createAnnouncement);
router.get('/', getAnnouncements);
router.delete('/:id', deleteAnnouncement);

module.exports = router;
