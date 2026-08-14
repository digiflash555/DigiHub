const mongoose = require('mongoose');

const volunteerApplicationSchema = new mongoose.Schema({
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    applicant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    role: {
        type: String,
        default: 'Event Volunteer'
    },
    motivation: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    applicantName: {
        type: String,
        required: true
    },
    applicantRollNumber: {
        type: String,
        required: true
    },
    applicantYearAndDept: {
        type: String,
        required: true
    },
    applicantSection: {
        type: String,
        required: true
    },
    // Whether On-Duty has been issued by admin for academics
    onDutyIssued: {
        type: Boolean,
        default: false
    },
    onDutyNote: {
        type: String,
        default: ''
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// One application per member per event
volunteerApplicationSchema.index({ event: 1, applicant: 1 }, { unique: true });

module.exports = mongoose.model('VolunteerApplication', volunteerApplicationSchema);
