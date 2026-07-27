const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema({
    label: { type: String, required: true },
    type: { 
        type: String, 
        enum: ['text', 'textarea', 'dropdown', 'radio', 'checkbox', 'number', 'date', 'file'],
        required: true 
    },
    options: [String],
    required: { type: Boolean, default: false },
    placeholder: String
});

const nominationFormSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    fields: [fieldSchema],
    isActive: { type: Boolean, default: true },
    startDate: Date,
    endDate: Date,
    deadline: Date,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
    timestamps: true
});

module.exports = mongoose.model('NominationForm', nominationFormSchema);
