const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema({
    label: { type: String, required: true },
    type: { 
        type: String, 
        enum: ['text', 'textarea', 'dropdown', 'radio', 'checkbox', 'file', 'number', 'date'],
        required: true 
    },
    options: [String], // For dropdown, radio, checkbox
    required: { type: Boolean, default: false },
    placeholder: String
});

const feedbackTemplateSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    fields: [fieldSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, {
    timestamps: true
});

module.exports = mongoose.model('FeedbackTemplate', feedbackTemplateSchema);
