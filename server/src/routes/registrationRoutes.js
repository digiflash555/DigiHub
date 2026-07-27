const express = require('express');
const router = express.Router();
const { 
    registerForEvent, 
    getMyRegistrations, 
    getEventRegistrations,
    getAllRegistrations,
    getClassRegistrations,
    registrationFileUpload,
    exportRegistrationPDF,
    getTotalParticipation
} = require('../controllers/registrationController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.post('/', protect, registrationFileUpload.any(), registerForEvent);
router.get('/my', protect, getMyRegistrations);
router.get('/all', protect, authorize('Admin'), getAllRegistrations);
router.get('/class', protect, authorize('Class Coordinator', 'Program Coordinator', 'Admin'), getClassRegistrations);
router.get('/event/:eventId', protect, authorize('Admin', 'Association Member', 'Class Coordinator', 'Program Coordinator', 'Faculty'), getEventRegistrations);
router.post('/export/pdf/:eventId', protect, authorize('Admin', 'Class Coordinator', 'Program Coordinator', 'Faculty', 'Association Member'), exportRegistrationPDF);
router.get('/total-participation', protect, authorize('Admin'), getTotalParticipation);

module.exports = router;
