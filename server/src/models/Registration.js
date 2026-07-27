const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    participant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    registrationId: { type: String, required: true },
    formData: { type: Map, of: mongoose.Schema.Types.Mixed },
    qrCode: { type: String }, // Base64 or URL
    attendanceStatus: { type: Boolean, default: false },
    attendanceTime: { type: Date },
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    signature: { type: String },
    feedbackSubmitted: { type: Boolean, default: false },
    status: { type: String, enum: ['Pending', 'Confirmed', 'Cancelled'], default: 'Confirmed' }
}, {
    timestamps: true
});

module.exports = mongoose.model('Registration', registrationSchema);
