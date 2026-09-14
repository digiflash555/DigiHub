const mongoose = require('mongoose');

const scheduledEmailSchema = new mongoose.Schema({
    subject: { type: String, required: true },
    body: { type: String, required: true },
    recipientGroups: [{ type: String }],
    individualRecipients: [{ type: String }],
    cc: [{ type: String }],
    bcc: [{ type: String }],
    attachments: [{ 
        filename: String,
        path: String,
        mimetype: String,
        size: Number
    }],
    scheduledDate: { type: Date, required: true },
    status: { type: String, enum: ['Scheduled', 'Processing', 'Failed', 'Completed'], default: 'Scheduled' },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' } // Optional reference
}, { timestamps: true });

module.exports = mongoose.model('ScheduledEmail', scheduledEmailSchema);
