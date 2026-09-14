const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['Pending', 'Accepted', 'Rejected'], default: 'Pending' }
});

const teamSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    leader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [memberSchema],
    isRegistrationComplete: { type: Boolean, default: false }
}, {
    timestamps: true
});

module.exports = mongoose.model('Team', teamSchema);
