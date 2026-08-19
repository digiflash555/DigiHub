const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    responses: { type: Map, of: mongoose.Schema.Types.Mixed },
    submittedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

// Ensure a user can only submit feedback once per event
feedbackSchema.index({ event: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
