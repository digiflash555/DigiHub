const mongoose = require('mongoose');

const defaultFieldSchema = new mongoose.Schema({
    label: { type: String, required: true },
    type: {
        type: String,
        enum: ['text', 'textarea', 'dropdown', 'number', 'date', 'table'],
        default: 'text'
    },
    required: { type: Boolean, default: false },
    options: [String]
}, { _id: true });

const settingsSchema = new mongoose.Schema({
    nominationFormsEnabled: {
        type: Boolean,
        default: true
    },
    volunteerRestriction: {
        type: String,
        enum: ['all', 'upcoming_events_only'],
        default: 'upcoming_events_only'
    },
    symposiumName: {
        type: String,
        default: 'DIGIFLASH 2026'
    },
    symposiumType: {
        type: String,
        default: 'National Level Technical Symposium'
    },
    iicLogo: {
        type: String,
        default: ''
    },
    digiflashLogo: {
        type: String,
        default: ''
    },
    associationCoordinatorSign: {
        type: String,
        default: ''
    },
    hodSign: {
        type: String,
        default: ''
    },
    disabledDefaultFields: {
        type: [String],
        default: []
    },
    customDefaultLabels: {
        type: Map,
        of: String,
        default: {}
    },
    // Extra fields added by admin to the Default Questions section (appears on every form)
    defaultQuestionFields: {
        type: [defaultFieldSchema],
        default: []
    },
    // "Additional Details" section – editable title + admin-defined fields
    additionalDetailsSectionTitle: {
        type: String,
        default: 'Additional Details'
    },
    additionalDetailsFields: {
        type: [defaultFieldSchema],
        default: []
    }
}, {
    timestamps: true
});

// Singleton pattern - ensure only one settings document exists
settingsSchema.statics.getSettings = async function() {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({});
    }
    return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);
