const mongoose = require('mongoose');

const templateFieldSchema = new mongoose.Schema({
    fieldId: { type: String, required: true },
    type: { type: String, required: true },
    label: { type: String, required: true },
    placeholder: { type: String, default: '' },
    required: { type: Boolean, default: false },
    readOnly: { type: Boolean, default: false },
    hidden: { type: Boolean, default: false },
    defaultValue: { type: mongoose.Schema.Types.Mixed, default: '' },
    helpText: { type: String, default: '' },
    order: { type: Number, default: 0 },
    options: [String],
    validation: {
        minLength: Number,
        maxLength: Number,
        minValue: Number,
        maxValue: Number,
        regularExpression: String,
        fileSizeLimit: Number, // in MB
        allowedFileTypes: [String]
    },
    visibilityRules: {
        dependsOnFieldId: String,
        condition: { type: String, enum: ['equals', 'notEquals', 'contains', 'isNotEmpty', ''] },
        value: String
    }
});

const registrationTemplateSchema = new mongoose.Schema({
    templateName: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    category: { 
        type: String, 
        required: true,
        enum: ['Workshop', 'Hackathon', 'Seminar', 'Competition', 'Conference', 'Guest Lecture', 'Other'],
        default: 'Workshop'
    },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    fields: [templateFieldSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    version: { type: Number, default: 1 }
}, {
    timestamps: true
});

module.exports = mongoose.model('RegistrationTemplate', registrationTemplateSchema);
module.exports.templateFieldSchema = templateFieldSchema;
