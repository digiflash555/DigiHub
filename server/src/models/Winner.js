const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now }
});

const commentSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    replies: [replySchema],
    createdAt: { type: Date, default: Date.now }
});

const winnerSchema = new mongoose.Schema({
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    participant: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    position: { type: String, required: true },
    prize: { type: String },
    publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    profilePhoto: { type: String },
    photoUploadLocked: { type: Boolean, default: false },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [commentSchema]
}, {
    timestamps: true
});

module.exports = mongoose.model('Winner', winnerSchema);
