const mongoose = require('mongoose');

const ticTacToeGameSchema = new mongoose.Schema({
    gameType: {
        type: String,
        default: 'tic-tac-toe'
    },
    mode: {
        type: String,
        enum: ['ai', 'friend'],
        required: true
    },
    playerX: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    playerO: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    opponentName: {
        type: String,
        required: true
    },
    aiDifficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard', ''],
        default: ''
    },
    winner: {
        type: String,
        enum: ['X', 'O', 'Draw'],
        required: true
    },
    winningCombination: {
        type: [Number],
        default: []
    },
    resultForPlayerX: {
        type: String,
        enum: ['Win', 'Loss', 'Draw'],
        required: true
    },
    movesCount: {
        type: Number,
        default: 0
    },
    durationSeconds: {
        type: Number,
        default: 0
    },
    completedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('TicTacToeGame', ticTacToeGameSchema);
