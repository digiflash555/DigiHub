const mongoose = require('mongoose');

const emailConfigurationSchema = new mongoose.Schema({
    smtpHost: { type: String, required: true },
    smtpPort: { type: Number, required: true },
    smtpUsername: { type: String, required: true },
    smtpPassword: { type: String, required: true }, // Store as base64 or encrypted
    encryption: { type: String, enum: ['SSL', 'TLS', 'None'], default: 'TLS' },
    senderName: { type: String, required: true },
    senderEmail: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('EmailConfiguration', emailConfigurationSchema);
