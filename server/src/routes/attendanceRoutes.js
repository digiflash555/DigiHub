const express = require('express');
const router = express.Router();
const { markAttendance, getAttendanceReport, getAttendanceRecords, exportReport, exportPDFReport } = require('../controllers/attendanceController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.post('/mark', protect, authorize('Admin', 'Association Member', 'Class Coordinator', 'Program Coordinator', 'Faculty', 'Volunteer'), markAttendance);
router.get('/report/:eventId', protect, authorize('Admin', 'Association Member', 'Class Coordinator', 'Program Coordinator', 'Faculty'), getAttendanceReport);
router.get('/records/:eventId', protect, authorize('Admin', 'Association Member', 'Class Coordinator', 'Program Coordinator', 'Faculty'), getAttendanceRecords);
router.get('/export/:eventId', protect, authorize('Admin', 'Association Member', 'Class Coordinator', 'Program Coordinator', 'Faculty'), exportReport);
router.post('/export-pdf/:eventId', protect, authorize('Admin', 'Association Member', 'Class Coordinator', 'Program Coordinator', 'Faculty'), exportPDFReport);

module.exports = router;
