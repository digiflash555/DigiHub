const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { createCloudinaryUpload } = require('../utils/cloudinaryUpload');

// Transaction proof upload — stored in Cloudinary under event_management/transactions
// Supports images and raw documents (pdf, doc, docx)
const upload = createCloudinaryUpload('transactions', ['jpeg', 'jpg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx'], 1, 'transaction-proof-');


// @desc    Log money spent (Expense)
// @route   POST /api/transactions/spend
// @access  Private (Association Member)
exports.logSpent = async (req, res, next) => {
    try {
        const { amount, description, event } = req.body;

        if (!amount || amount <= 0) {
            res.status(400);
            throw new Error('Please enter a valid amount');
        }

        if (!description) {
            res.status(400);
            throw new Error('Please enter a description/purpose');
        }

        // If proof file was uploaded
        let proof = undefined;
        if (req.file) {
            proof = req.file.path;
        }

        // Create transaction
        const transaction = await Transaction.create({
            user: req.user._id,
            type: 'Spent',
            amount,
            description,
            event: event || undefined,
            addedBy: req.user._id,
            proof
        });

        // Update user's reimbursement balance
        await User.findByIdAndUpdate(req.user._id, {
            $inc: { reimbursementBalance: amount }
        });

        res.status(201).json(transaction);
    } catch (error) {
        next(error);
    }
};

// @desc    Log reimbursement (Reduce balance)
// @route   POST /api/transactions/reimburse
// @access  Private (Admin or Association Member reducing their own)
exports.logReimbursed = async (req, res, next) => {
    try {
        const { amount, description, targetUserId } = req.body;

        if (!amount || amount <= 0) {
            res.status(400);
            throw new Error('Please enter a valid amount');
        }

        // Determine which user's balance to reduce
        let userIdToReduce = targetUserId;
        
        // If current user is not Admin, they can only reduce their own balance
        if (req.user.role !== 'Admin') {
            userIdToReduce = req.user._id;
        }

        if (!userIdToReduce) {
            res.status(400);
            throw new Error('Please specify a target user');
        }

        const user = await User.findById(userIdToReduce);
        if (!user) {
            res.status(404);
            throw new Error('User not found');
        }

        // Create reimbursement transaction
        const transaction = await Transaction.create({
            user: userIdToReduce,
            type: 'Reimbursed',
            amount,
            description: description || 'Reimbursement logged',
            addedBy: req.user._id
        });

        // Decrease user's reimbursement balance
        await User.findByIdAndUpdate(userIdToReduce, {
            $inc: { reimbursementBalance: -amount }
        });

        res.status(201).json(transaction);
    } catch (error) {
        next(error);
    }
};

// @desc    Get member balances sorted by balance descending
// @route   GET /api/transactions/balances
// @access  Private (Admin)
exports.getBalances = async (req, res, next) => {
    try {
        // Find users that are Association Members or have spent money (reimbursementBalance > 0)
        const users = await User.find({
            $or: [
                { role: 'Association Member' },
                { reimbursementBalance: { $gt: 0 } }
            ]
        })
        .select('username email phone role department reimbursementBalance profileImage')
        .sort({ reimbursementBalance: -1 });

        res.json(users);
    } catch (error) {
        next(error);
    }
};

// @desc    Get current user's transaction history
// @route   GET /api/transactions/my
// @access  Private
exports.getMyTransactions = async (req, res, next) => {
    try {
        const transactions = await Transaction.find({ user: req.user._id })
            .populate('event', 'title eventDate venue')
            .populate('addedBy', 'username role')
            .sort({ date: -1 });

        res.json(transactions);
    } catch (error) {
        next(error);
    }
};

// @desc    Get specific user's transaction history
// @route   GET /api/transactions/user/:userId
// @access  Private (Admin)
exports.getUserTransactions = async (req, res, next) => {
    try {
        const transactions = await Transaction.find({ user: req.params.userId })
            .populate('event', 'title eventDate venue')
            .populate('addedBy', 'username role')
            .sort({ date: -1 });

        res.json(transactions);
    } catch (error) {
        next(error);
    }
};
// Export upload middleware
exports.upload = upload;
