const WorkRequest = require('../models/WorkRequest');
const User = require('../models/User'); // Assuming User model exists

// @desc    Create a new work request
// @route   POST /api/work-requests
// @access  Private (Faculty, Class Coordinator, Program Coordinator)
exports.createWorkRequest = async (req, res, next) => {
  try {
    const { title, description, priority, dueDate } = req.body;
    const requesterRole = req.user.role; // Role should be one of the allowed roles
    const requestedBy = req.user._id;

    const workRequest = await WorkRequest.create({
      title,
      description,
      priority,
      dueDate,
      requestedBy,
      requesterRole,
    });

    // Email notification removed

    res.status(201).json(workRequest);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all work requests (admin only)
// @route   GET /api/work-requests
// @access  Private/Admin
exports.getAllWorkRequests = async (req, res, next) => {
  try {
    const requests = await WorkRequest.find()
      .populate('requestedBy', 'username email')
      .populate('assignedTo', 'username email');
    res.json(requests);
  } catch (error) {
    next(error);
  }
};

// @desc    Get work requests created by the logged‑in user
// @route   GET /api/work-requests/mine
// @access  Private (any authenticated user)
exports.getMyWorkRequests = async (req, res, next) => {
  try {
    const requests = await WorkRequest.find({
      $or: [
        { requestedBy: req.user._id },
        { assignedTo: req.user._id }
      ]
    })
      .populate('requestedBy', 'username email')
      .populate('assignedTo', 'username email');
    res.json(requests);
  } catch (error) {
    next(error);
  }
};

// @desc    Assign a work request to an association member (admin only)
// @route   PATCH /api/work-requests/:id/assign
// @access  Private/Admin
exports.assignWorkRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { assigneeId } = req.body; // Association member user ID

    const assignee = await User.findById(assigneeId);
    if (!assignee) {
      res.status(404);
      throw new Error('Assignee user not found');
    }
    if (!['Association Member', 'Association Coordinator'].includes(assignee.role)) {
      res.status(400);
      throw new Error('User is not an association member');
    }

    const workRequest = await WorkRequest.findByIdAndUpdate(
      id,
      { assignedTo: assigneeId, status: 'Assigned' },
      { new: true }
    ).populate('requestedBy', 'username email');

    if (!workRequest) {
      res.status(404);
      throw new Error('Work request not found');
    }

    // Email notification removed

    res.json(workRequest);
  } catch (error) {
    next(error);
  }
};

// @desc    Update status of a work request (requester or assignee)
// @route   PATCH /api/work-requests/:id/status
// @access  Private (requester or assigned association member)
exports.updateWorkRequestStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, workDetails, experienceFeedback } = req.body; // Expected status values: Pending, Assigned, Accepted, Completed, Rejected

    const workRequest = await WorkRequest.findById(id);
    if (!workRequest) {
      res.status(404);
      throw new Error('Work request not found');
    }

    // Only Admin, original requester, or the assigned member can change status
    const isAdmin = req.user.role === 'Admin';
    const isRequester = workRequest.requestedBy.toString() === req.user._id.toString();
    const isAssignee = workRequest.assignedTo && workRequest.assignedTo.toString() === req.user._id.toString();
    
    if (!isAdmin && !isRequester && !isAssignee) {
      res.status(403);
      throw new Error('You are not authorized to update this work request status');
    }

    workRequest.status = status;
    if (status === 'Completed') {
      if (workDetails) workRequest.workDetails = workDetails;
      if (experienceFeedback) workRequest.experienceFeedback = experienceFeedback;
    }
    
    await workRequest.save();
    res.json(workRequest);
  } catch (error) {
    next(error);
  }
};
