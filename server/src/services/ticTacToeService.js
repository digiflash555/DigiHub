const TicTacToeGame = require('../models/TicTacToeGame');
const GameStats = require('../models/GameStats');
const User = require('../models/User');
const { checkWinner } = require('./ticTacToeAI');

// Get or create GameStats for a user
const getUserStats = async (userId) => {
    let stats = await GameStats.findOne({ user: userId });
    if (!stats) {
        stats = await GameStats.create({ user: userId });
    }
    return stats;
};

// Recalculate stats for a user
const updateUserStats = async (userId, result, isAI = false) => {
    const stats = await getUserStats(userId);
    
    stats.gamesPlayed += 1;
    if (result === 'Win') {
        stats.wins += 1;
        if (isAI) stats.aiWins += 1;
        else stats.friendWins += 1;
    } else if (result === 'Loss') {
        stats.losses += 1;
    } else if (result === 'Draw') {
        stats.draws += 1;
    }

    stats.winRate = Math.round((stats.wins / stats.gamesPlayed) * 100);
    await stats.save();
    return stats;
};

// Record game result in database
const recordGameResult = async ({
    userId,
    mode,
    playerOId = null,
    opponentName,
    aiDifficulty = '',
    winner, // 'X', 'O', 'Draw'
    winningCombination = [],
    movesCount = 0,
    durationSeconds = 0
}) => {
    let resultForPlayerX = 'Draw';
    if (winner === 'X') resultForPlayerX = 'Win';
    else if (winner === 'O') resultForPlayerX = 'Loss';

    const game = await TicTacToeGame.create({
        gameType: 'tic-tac-toe',
        mode,
        playerX: userId,
        playerO: playerOId,
        opponentName,
        aiDifficulty,
        winner,
        winningCombination,
        resultForPlayerX,
        movesCount,
        durationSeconds,
        completedAt: new Date()
    });

    // Update Player X stats
    await updateUserStats(userId, resultForPlayerX, mode === 'ai');

    // Update Player O stats if multiplayer
    if (mode === 'friend' && playerOId) {
        let resultForPlayerO = 'Draw';
        if (winner === 'O') resultForPlayerO = 'Win';
        else if (winner === 'X') resultForPlayerO = 'Loss';

        await updateUserStats(playerOId, resultForPlayerO, false);
    }

    return game;
};

// Get match history for a user
const getUserHistory = async (userId, filter = 'All', page = 1, limit = 20) => {
    const query = {
        $or: [
            { playerX: userId },
            { playerO: userId }
        ]
    };

    if (filter === 'Wins') {
        query.$or = [
            { playerX: userId, resultForPlayerX: 'Win' },
            { playerO: userId, winner: 'O' }
        ];
    } else if (filter === 'Losses') {
        query.$or = [
            { playerX: userId, resultForPlayerX: 'Loss' },
            { playerO: userId, winner: 'X' }
        ];
    } else if (filter === 'Draws') {
        query.winner = 'Draw';
    } else if (filter === 'DigiHub') {
        query.mode = 'ai';
    } else if (filter === 'Friend') {
        query.mode = 'friend';
    }

    const total = await TicTacToeGame.countDocuments(query);
    const games = await TicTacToeGame.find(query)
        .sort({ completedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('playerX', 'username profileImage yearAndDept section')
        .populate('playerO', 'username profileImage yearAndDept section');

    // Formatted games for frontend display
    const formattedGames = games.map(g => {
        const isX = g.playerX && g.playerX._id.toString() === userId.toString();
        let result = 'Draw';
        if (g.winner === 'Draw') result = 'Draw';
        else if ((isX && g.winner === 'X') || (!isX && g.winner === 'O')) result = 'Win';
        else result = 'Loss';

        let opponent = g.opponentName;
        if (g.mode === 'friend') {
            const oppUser = isX ? g.playerO : g.playerX;
            if (oppUser) opponent = oppUser.username;
        }

        return {
            id: g._id,
            mode: g.mode,
            opponent,
            aiDifficulty: g.aiDifficulty,
            result,
            winner: g.winner,
            movesCount: g.movesCount,
            durationSeconds: g.durationSeconds,
            date: g.completedAt
        };
    });

    return {
        games: formattedGames,
        total,
        page,
        pages: Math.ceil(total / limit)
    };
};

// Get leaderboard of top players (only players with at least 1 win)
const getLeaderboard = async (limit = 20) => {
    const leaderboard = await GameStats.find({ wins: { $gt: 0 } })
        .sort({ wins: -1, winRate: -1, gamesPlayed: -1 })
        .limit(limit)
        .populate('user', 'username profileImage yearAndDept section associationRole role');

    return leaderboard.map((item, index) => ({
        rank: index + 1,
        user: item.user,
        wins: item.wins,
        losses: item.losses,
        draws: item.draws,
        gamesPlayed: item.gamesPlayed,
        winRate: item.winRate,
        aiWins: item.aiWins,
        friendWins: item.friendWins
    }));
};

module.exports = {
    getUserStats,
    recordGameResult,
    getUserHistory,
    getLeaderboard,
    checkWinner
};
