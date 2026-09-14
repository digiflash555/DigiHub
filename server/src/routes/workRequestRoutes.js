const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const {
  createWorkRequest,
  getAllWorkRequests,
  getMyWorkRequests,
  assignWorkRequest,
  updateWorkRequestStatus,
} = require('../controllers/workRequestController');

// Create request (Faculty, Class Coordinator, Program Coordinator)
router.route('/')
  .post(
    protect,
    authorize('Faculty', 'Class Coordinator', 'Program Coordinator'),
    createWorkRequest
  )
  .get(
    protect,
    authorize('Admin'),
    getAllWorkRequests
  );

// Get own requests
router.get('/mine', protect, getMyWorkRequests);

// Assign request (admin only)
router.patch('/:id/assign', protect, authorize('Admin'), assignWorkRequest);

// Update status (requester or assignee)
router.patch('/:id/status', protect, updateWorkRequestStatus);

module.exports = router;
