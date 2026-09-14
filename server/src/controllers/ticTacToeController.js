const { getUserStats, getUserHistory, getLeaderboard, recordGameResult } = require('../services/ticTacToeService');
const { getAIMove, checkWinner } = require('../services/ticTacToeAI');

// @desc    Get current user's Tic-Tac-Toe stats
// @route   GET /api/games/tictactoe/stats
// @access  Private
const getStats = async (req, res) => {
    try {
        const stats = await getUserStats(req.user._id);
        res.json(stats);
    } catch (error) {
        console.error('Error fetching game stats:', error);
        res.status(500).json({ message: 'Failed to fetch game statistics' });
    }
};

// @desc    Get user's match history
// @route   GET /api/games/tictactoe/history
// @access  Private
const getHistory = async (req, res) => {
    try {
        const filter = req.query.filter || 'All';
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;

        const history = await getUserHistory(req.user._id, filter, page, limit);
        res.json(history);
    } catch (error) {
        console.error('Error fetching game history:', error);
        res.status(500).json({ message: 'Failed to fetch match history' });
    }
};

// @desc    Get global Tic-Tac-Toe leaderboard
// @route   GET /api/games/tictactoe/leaderboard
// @access  Private
const getLeaderboardData = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const leaderboard = await getLeaderboard(limit);
        res.json(leaderboard);
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ message: 'Failed to fetch leaderboard' });
    }
};

// @desc    Get AI move for single-player game
// @route   POST /api/games/tictactoe/ai-move
// @access  Private
const calculateAIMove = async (req, res) => {
    try {
        const { board, difficulty } = req.body;

        if (!Array.isArray(board) || board.length !== 9) {
            return res.status(400).json({ message: 'Invalid board state' });
        }

        const moveIndex = getAIMove(board, difficulty || 'Hard');
        res.json({ move: moveIndex });
    } catch (error) {
        console.error('Error generating AI move:', error);
        res.status(500).json({ message: 'Failed to generate AI move' });
    }
};

// @desc    Record completed game result (Single Player vs AI)
// @route   POST /api/games/tictactoe/result
// @access  Private
const saveResult = async (req, res) => {
    try {
        const {
            mode = 'ai',
            opponentName = 'DigiHub',
            aiDifficulty = 'Hard',
            winner, // 'X', 'O', 'Draw'
            winningCombination = [],
            movesCount = 0,
            durationSeconds = 0
        } = req.body;

        if (!winner) {
            return res.status(400).json({ message: 'Winner status is required' });
        }

        const result = await recordGameResult({
            userId: req.user._id,
            mode,
            opponentName,
            aiDifficulty,
            winner,
            winningCombination,
            movesCount,
            durationSeconds
        });

        // Get updated stats
        const updatedStats = await getUserStats(req.user._id);

        res.json({
            message: 'Game result saved successfully',
            game: result,
            stats: updatedStats
        });
    } catch (error) {
        console.error('Error saving game result:', error);
        res.status(500).json({ message: 'Failed to save game result' });
    }
};

module.exports = {
    getStats,
    getHistory,
    getLeaderboardData,
    calculateAIMove,
    saveResult
};
