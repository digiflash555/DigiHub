const express = require('express');
const router = express.Router();
const {
    createEvent,
    getEvents,
    getEventById,
    updateEvent,
    deleteEvent,
    getEventStats,
    getPublicStats,
    publishResults,
    getMyInchargeEvents,
    upload,
    importTemplate,
    saveAsTemplate
} = require('../controllers/eventController');
const { protect, optionalProtect, authorize } = require('../middlewares/authMiddleware');

router.get('/public-stats', getPublicStats);
router.get('/stats', protect, authorize('Admin'), getEventStats);
router.get('/my-incharge', protect, getMyInchargeEvents);

router.route('/')
    .get(optionalProtect, getEvents)
    .post(protect, authorize('Admin'), upload.single('bannerImage'), createEvent);

router.route('/:id')
    .get(getEventById)
    .put(protect, authorize('Admin'), upload.single('bannerImage'), updateEvent)
    .delete(protect, authorize('Admin'), deleteEvent);

router.put('/:id/publish-results', protect, authorize('Admin'), publishResults);

const allowedRoles = ['Admin', 'Faculty', 'Faculty Coordinator', 'Student Coordinator', 'Association Member', 'Class Coordinator', 'Program Coordinator'];
router.post('/:eventId/import-template', protect, authorize(...allowedRoles), importTemplate);
router.post('/:eventId/save-template', protect, authorize(...allowedRoles), saveAsTemplate);

module.exports = router;
