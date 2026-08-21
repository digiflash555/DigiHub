const mongoose = require('mongoose');

const emailTemplateSchema = new mongoose.Schema({
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', default: null }, // Null means global
    name: { type: String, required: true },
    trigger: { type: String, required: true },
    subject: { type: String, required: true },
    body: { type: String, required: true },
    enabled: { type: Boolean, default: true },
    recipientType: { type: String, required: true }, // e.g., "User", "Participant", "Volunteer"
    availableVariables: [{ type: String }],
    isDefault: { type: Boolean, default: false }
}, { timestamps: true });

emailTemplateSchema.index({ eventId: 1, trigger: 1 }, { unique: true });

module.exports = mongoose.model('EmailTemplate', emailTemplateSchema);
