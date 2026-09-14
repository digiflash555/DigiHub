const LudoGame = require('../models/LudoGame');

// @desc    Record completed Ludo match
// @route   POST /api/games/ludo/result
// @access  Private
const recordResult = async (req, res) => {
    try {
        const { mode = 'pvp_ai', playerCount = 4, winner, durationSeconds = 0 } = req.body;

        if (!winner) {
            return res.status(400).json({ message: 'Winner color is required' });
        }

        const game = await LudoGame.create({
            gameType: 'ludo',
            mode,
            playerCount,
            winner,
            winnerUser: req.user._id,
            durationSeconds,
            completedAt: new Date()
        });

        res.json({ message: 'Ludo match recorded successfully', game });
    } catch (error) {
        console.error('Error saving Ludo game result:', error);
        res.status(500).json({ message: 'Failed to save Ludo game result' });
    }
};

// @desc    Get Ludo match history
// @route   GET /api/games/ludo/history
// @access  Private
const getHistory = async (req, res) => {
    try {
        const games = await LudoGame.find({ winnerUser: req.user._id })
            .sort({ completedAt: -1 })
            .limit(20);

        res.json(games);
    } catch (error) {
        console.error('Error fetching Ludo history:', error);
        res.status(500).json({ message: 'Failed to fetch Ludo history' });
    }
};

module.exports = {
    recordResult,
    getHistory
};
