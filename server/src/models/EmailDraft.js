const mongoose = require('mongoose');

const emailDraftSchema = new mongoose.Schema({
    subject: { type: String, default: '' },
    body: { type: String, default: '' },
    recipientGroups: [{ type: String }],
    individualRecipients: [{ type: String }],
    cc: [{ type: String }],
    bcc: [{ type: String }],
    attachments: [{ 
        filename: String,
        path: String,
        mimetype: String,
        size: Number
    }]
}, { timestamps: true });

module.exports = mongoose.model('EmailDraft', emailDraftSchema);
