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

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    bannerImage: { type: String },
    venue: { type: String, required: true },
    eventDate: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    registrationDeadline: { type: Date, required: true },
    maxParticipants: { type: Number, required: true },
    category: { type: String, required: true },
    participationType: { type: String, enum: ['Individual', 'Team'], default: 'Individual' },
    minTeamSize: { type: Number, default: 1 },
    maxTeamSize: { type: Number, default: 1 },
    status: { 
        type: String, 
        enum: ['Draft', 'Open', 'Closed', 'Completed', 'Cancelled'],
        default: 'Draft' 
    },
    registrationForm: [fieldSchema],
    feedbackForm: [fieldSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    facultyCoordinator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    studentCoordinator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isPublished: { type: Boolean, default: false },
    resultsPublished: { type: Boolean, default: false },
    certificateConfig: {
        template: String,
        fields: [{
                type: { type: String },
            text: String,
            x: Number,
            y: Number,
            fontSize: { type: Number, default: 20 },
            color: { type: String, default: '#000000' },
            fontStyle: { type: String, default: 'normal' },
            fontFamily: String,
            variableColors: { type: mongoose.Schema.Types.Mixed, default: {} },
            variableFontStyles: { type: mongoose.Schema.Types.Mixed, default: {} },
            variableFontFamilies: { type: mongoose.Schema.Types.Mixed, default: {} },
            underlineVariables: Boolean,
            width: Number,
            alignment: { type: String, default: 'left' }
        }]
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Event', eventSchema);
