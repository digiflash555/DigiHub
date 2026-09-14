const mongoose = require('mongoose');

const ludoGameSchema = new mongoose.Schema({
    gameType: {
        type: String,
        default: 'ludo'
    },
    mode: {
        type: String,
        enum: ['pvp_ai', 'local'],
        default: 'pvp_ai'
    },
    playerCount: {
        type: Number,
        default: 4
    },
    winner: {
        type: String,
        enum: ['Red', 'Green', 'Yellow', 'Blue'],
        required: true
    },
    winnerUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
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

module.exports = mongoose.model('LudoGame', ludoGameSchema);
