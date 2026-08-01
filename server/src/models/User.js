const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Encryption disabled – values are stored plain-text.
// Keeping the constant for backward compatibility (no actual key needed).
const ENCRYPTION_KEY = null;

const encrypt = (text) => (text ? String(text) : '');

const decrypt = (text) => (text ? String(text) : '');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Please add a username'],
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false
    },
    role: {
        type: String,
        enum: ['Participant', 'Association Member', 'Admin', 'Faculty', 'Faculty Coordinator', 'Student Coordinator'],
        default: 'Participant'
    },
    membershipStatus: {
        type: String,
        enum: ['Present', 'Past'],
        default: 'Present'
    },
    associationRole: {
        type: String,
        enum: [
            'President',
            'Secretary',
            'General Secretary',
            'Treasurer',
            'Vice – President',
            'Joint Secretary',
            'Technical Coordinator',
            'Event Coordinator',
            'Media & Social Media Coordinator',
            'Photography & Design Coordinator',
            'Chief Editor & Head of Digitimes',
            'Digitimes Incharge',
            'Digitimes Incharge (Magazine)',
            'Byte Bulletin Incharge',
            'Byte Bulletin Incharge (Newsletter)',
            'Web Designing Coordinator',
            'Documentation Incharge',
            'Executive Member',
            'Digitimes Magazine Team',
            'Senior Executive Member',
            ''
        ],
        default: ''
    },
    registrationNumber: {
        type: String,
        unique: true,
        sparse: true
    },
    employeeId: {
        type: String,
        unique: true,
        sparse: true
    },
    department: {
        type: String,
        default: 'Computer Science and Engineering'
    },
    designation: {
        type: String,
        default: 'Assistant Professor'
    },
    // For users: Which class they manage
    assignedYear: {
        type: String,
        enum: ['I', 'II', 'III', 'IV'],
        sparse: true
    },
    assignedSection: {
        type: String,
        enum: ['A', 'B', 'C', 'Nil', ''],
        sparse: true
    },
    phone: {
        type: String,
        sparse: true
    },
    bio: {
        type: String,
        maxlength: 500,
        default: ''
    },
    skills: [{
        type: String
    }],
    dateOfBirth: {
        type: Date
    },
    signature: {
        type: String,
        default: ''
    },
    profileImage: {
        type: String,
        default: 'default-profile.png'
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other'],
        default: 'Male'
    },
    // For students: Their current details
    yearAndDept: {
        type: String,
        enum: [
            'I B.E. CSE', 'II B.E. CSE', 'III B.E. CSE', 'IV B.E. CSE',
            'I B.E. ECE', 'II B.E. ECE', 'III B.E. ECE', 'IV B.E. ECE',
            'I B.E. EEE', 'II B.E. EEE', 'III B.E. EEE', 'IV B.E. EEE',
            'I B.E. Mechanical', 'II B.E. Mechanical', 'III B.E. Mechanical', 'IV B.E. Mechanical',
            'I B.E. Civil', 'II B.E. Civil', 'III B.E. Civil', 'IV B.E. Civil',
            'I B.E. IT', 'II B.E. IT', 'III B.E. IT', 'IV B.E. IT',
            'I B.E. AI&DS', 'II B.E. AI&DS', 'III B.E. AI&DS', 'IV B.E. AI&DS',
            'I B.E. Mechatronics', 'II B.E. Mechatronics', 'III B.E. Mechatronics', 'IV B.E. Mechatronics',
            'I B.E. AIML(CSE)', 'II B.E. AIML(CSE)', 'III B.E. AIML(CSE)', 'IV B.E. AIML(CSE)',
            'I B.E. ACT', 'II B.E. ACT', 'III B.E. ACT', 'IV B.E. ACT',
            'I B.E. VLSI', 'II B.E. VLSI', 'III B.E. VLSI', 'IV B.E. VLSI',
            'I B.E. CYBER(CSE)', 'II B.E. CYBER(CSE)', 'III B.E. CYBER(CSE)', 'IV B.E. CYBER(CSE)',
            'I B.E. AUTO', 'II B.E. AUTO', 'III B.E. AUTO', 'IV B.E. AUTO'
        ],
        default: 'I B.E. CSE'
    },
    section: {
        type: String,
        enum: ['A', 'B', 'C', 'Nil', ''],
        default: 'A'
    },
    collegeName: {
        type: String,
        default: 'Dr. Mahalingam College of Engineering and Technology'
    },
    passoutYear: {
        type: Number,
        sparse: true
    },
    reimbursementBalance: {
        type: Number,
        default: 0
    },
    // Security questions for password reset
    securityQuestions: {
        bestFriendName: {
            type: String,
            required: false,
            set: encrypt,
            get: decrypt
        },
        favoriteColor: {
            type: String,
            required: false,
            set: encrypt,
            get: decrypt
        },
        favoriteHero: {
            type: String,
            required: false,
            set: encrypt,
            get: decrypt
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Encrypt password using bcrypt
userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Verify security question answers
userSchema.methods.matchSecurityAnswers = function (answers) {
    if (!this.securityQuestions || !answers) return false;

    const normalize = (str) => (str || '').toString().trim().toLowerCase();

    return (
        normalize(this.securityQuestions.bestFriendName) === normalize(answers.bestFriendName) &&
        normalize(this.securityQuestions.favoriteColor) === normalize(answers.favoriteColor) &&
        normalize(this.securityQuestions.favoriteHero) === normalize(answers.favoriteHero)
    );
};

module.exports = mongoose.model('User', userSchema);
