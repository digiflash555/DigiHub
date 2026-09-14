const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
    getStats,
    getHistory,
    getLeaderboardData,
    calculateAIMove,
    saveResult
} = require('../controllers/ticTacToeController');

router.use(protect);

router.get('/stats', getStats);
router.get('/history', getHistory);
router.get('/leaderboard', getLeaderboardData);
router.post('/ai-move', calculateAIMove);
router.post('/result', saveResult);

module.exports = router;
