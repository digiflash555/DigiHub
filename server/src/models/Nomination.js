const mongoose = require('mongoose');

const nominationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    form: { type: mongoose.Schema.Types.ObjectId, ref: 'NominationForm', required: true },
    postAppliedFor: { type: String, required: true },
    personalInfo: {
        name: { type: String },
        year: { type: String },
        section: { type: String },
        gender: { type: String },
        dateOfBirth: { type: String },
        rollNumber: { type: String }
    },
    academicProficiency: {
        tenthPercentage: { type: String },
        diplomaPercentage: { type: String },
        cgpa: { type: String },
        noOfArrears: { type: String }
    },
    previousPositions: [{
        nameOfBody: { type: String },
        position: { type: String },
        period: { type: String }
    }],
    contributions: {
        academic: { type: String },
        coCurricular: { type: String },
        extracurricular: { type: String },
        otherNotable: { type: String }
    },
    status: {
        type: String,
        enum: [
            'Pending Admin', 
            'Approved', 
            'Rejected'
        ],
        default: 'Pending Admin'
    },
    approvalHistory: {
        type: [{
            stage: String,
            approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            status: String,
            remarks: String,
            updatedAt: { type: Date, default: Date.now }
        }],
        default: []
    },
    customFields: {
        type: Map,
        of: String,
        default: {}
    },
    candidatePhoto: { type: String, default: '' },
    active: { type: Boolean, default: true }
}, {
    timestamps: true
});

module.exports = mongoose.model('Nomination', nominationSchema);
