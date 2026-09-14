const express = require('express');
const router = express.Router();
const {
    logSpent,
    logReimbursed,
    getBalances,
    getMyTransactions,
    getUserTransactions,
    upload
} = require('../controllers/transactionController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Protect all routes
router.use(protect);

router.post('/spend', upload.single('proof'), logSpent);
router.post('/reimburse', logReimbursed);
router.get('/my', getMyTransactions);

// Admin only routes
router.get('/balances', authorize('Admin'), getBalances);
router.get('/user/:userId', authorize('Admin'), getUserTransactions);

module.exports = router;
