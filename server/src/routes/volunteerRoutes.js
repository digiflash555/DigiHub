const express = require('express');
const router = express.Router();
const {
    applyToVolunteer,
    getMyApplications,
    getAllApplications,
    updateApplication,
    withdrawApplication
} = require('../controllers/volunteerController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.post('/apply', protect, authorize('Association Member'), applyToVolunteer);
router.get('/my', protect, authorize('Association Member'), getMyApplications);
router.get('/all', protect, authorize('Admin', 'Class Coordinator', 'Program Coordinator'), getAllApplications);
router.put('/:id', protect, authorize('Admin'), updateApplication);
router.delete('/:id', protect, authorize('Association Member'), withdrawApplication);

module.exports = router;
