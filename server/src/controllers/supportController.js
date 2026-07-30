const SupportQuery = require('../models/SupportQuery');

// @desc    Submit a new query/suggestion
// @route   POST /api/support
// @access  Private
exports.submitQuery = async (req, res, next) => {
    try {
        const query = await SupportQuery.create({
            user: req.user._id,
            subject: req.body.subject,
            category: req.body.category,
            message: req.body.message
        });
        res.status(201).json(query);
    } catch (error) {
        next(error);
    }
};

// @desc    Get all queries (Admin access)
// @route   GET /api/support
// @access  Private/Admin
exports.getQueries = async (req, res, next) => {
    try {
        const queries = await SupportQuery.find()
            .populate('user', 'username email')
            .sort({ createdAt: -1 });
        res.json(queries);
    } catch (error) {
        next(error);
    }
};

// @desc    Get user's own queries
// @route   GET /api/support/my
// @access  Private
exports.getMyQueries = async (req, res, next) => {
    try {
        const queries = await SupportQuery.find({ user: req.user._id })
            .sort({ createdAt: -1 });
        res.json(queries);
    } catch (error) {
        next(error);
    }
};

// @desc    Update query status (Admin access)
// @route   PUT /api/support/:id
// @access  Private/Admin
exports.updateQueryStatus = async (req, res, next) => {
    try {
        const { status, adminRemarks } = req.body;
        const query = await SupportQuery.findByIdAndUpdate(
            req.params.id,
            { status, adminRemarks },
            { new: true }
        );
        if (!query) {
            res.status(404);
            throw new Error('Query not found');
        }
        res.json(query);
    } catch (error) {
        next(error);
    }
};
