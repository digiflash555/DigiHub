const mongoose = require('mongoose');

const supportQuerySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    subject: {
        type: String,
        required: [true, 'Please add a subject'],
        trim: true
    },
    category: {
        type: String,
        enum: ['Complaint', 'Issue', 'Suggestion', 'Query', 'Other'],
        default: 'Query'
    },
    message: {
        type: String,
        required: [true, 'Please add a message'],
        maxlength: 1000
    },
    status: {
        type: String,
        enum: ['Pending', 'In Progress', 'Resolved', 'Closed'],
        default: 'Pending'
    },
    adminRemarks: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('SupportQuery', supportQuerySchema);
