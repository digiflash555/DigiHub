const express = require('express');
const router = express.Router();
const { 
    submitFeedback, 
    getEventFeedback, 
    checkFeedbackStatus,
    getFeedbackAnalytics,
    exportFeedbackExcel,
    exportFeedbackPDF
} = require('../controllers/feedbackController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.route('/')
    .post(protect, submitFeedback);

router.route('/event/:eventId')
    .get(protect, authorize('Admin', 'Association Member', 'Faculty'), getEventFeedback);

router.route('/analytics/:eventId')
    .get(protect, authorize('Admin', 'Association Member', 'Faculty'), getFeedbackAnalytics);

router.route('/export/excel/:eventId')
    .get(protect, authorize('Admin', 'Association Member', 'Faculty'), exportFeedbackExcel);

router.route('/export/pdf/:eventId')
    .get(protect, authorize('Admin', 'Association Member', 'Faculty'), exportFeedbackPDF);


router.route('/check/:eventId')
    .get(protect, checkFeedbackStatus);

module.exports = router;
