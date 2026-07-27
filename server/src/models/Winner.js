const mongoose = require('mongoose');

const winnerSchema = new mongoose.Schema({
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    participant: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    position: { type: String, required: true }, // e.g., '1st Place', '2nd Place', 'Special Mention'
    prize: { type: String },
    publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
    timestamps: true
});

module.exports = mongoose.model('Winner', winnerSchema);
