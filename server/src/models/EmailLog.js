const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema({
    sender: { type: String, required: true },
    recipientCount: { type: Number, required: true },
    recipients: [{ type: String }], // Store up to 50, otherwise just rely on count to save space
    recipientGroups: [{ type: String }],
    cc: [{ type: String }],
    bcc: [{ type: String }],
    subject: { type: String, required: true },
    body: { type: String }, // For manual emails, might be large, but useful for logs
    emailType: { type: String, enum: ['Manual', 'Automatic'], required: true },
    templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'EmailTemplate' },
    status: { type: String, enum: ['Sent', 'Failed', 'Pending'], required: true },
    failureReason: { type: String },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('EmailLog', emailLogSchema);
