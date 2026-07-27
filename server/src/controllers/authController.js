const User = require('../models/User');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const { createCloudinaryUpload } = require('../utils/cloudinaryUpload');

const uploadsDir = require('../utils/ensureUploadsDir').ensureUploadsDir();

// Profile picture upload — stored in Cloudinary under event_management/profiles
const upload = createCloudinaryUpload('profiles', ['jpeg', 'jpg', 'png', 'gif', 'webp'], 1, 'profile-');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Register a new PARTICIPANT (public)
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
    try {
        const { username, email, password, registrationNumber, phone, bio, skills, dateOfBirth, signature, gender, yearAndDept, section, passoutYear, securityQuestions } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            res.status(400);
            throw new Error('An account with this email already exists');
        }

        // Public registration is ALWAYS Participant - role cannot be set externally
        const user = await User.create({
            username,
            email,
            password,
            role: 'Participant',
            registrationNumber: registrationNumber || undefined,
            phone: phone || undefined,
            bio: bio || '',
            skills: skills || [],
            dateOfBirth: dateOfBirth || undefined,
            signature: signature || '',
            gender: gender || 'Male',
            yearAndDept: yearAndDept || 'I B.E. CSE',
            section: section || 'A',
            passoutYear: passoutYear || undefined,
            securityQuestions: securityQuestions || undefined,
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                registrationNumber: user.registrationNumber,
                phone: user.phone,
                bio: user.bio,
                skills: user.skills,
                dateOfBirth: user.dateOfBirth,
                signature: user.signature,
                gender: user.gender,
                yearAndDept: user.yearAndDept,
                section: user.section,
                passoutYear: user.passoutYear,
                token: generateToken(user._id),
            });
        } else {
            res.status(400);
            throw new Error('Invalid user data');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Create an Association Member account (Admin only)
// @route   POST /api/auth/create-association-member
// @access  Private/Admin
exports.createAssociationMember = async (req, res, next) => {
    try {
        const { 
            username, email, password, registrationNumber, 
            phone, gender, yearAndDept, section, passoutYear, membershipStatus, role, associationRole, dateOfBirth
        } = req.body;

        if (!username || !email || !password) {
            res.status(400);
            throw new Error('Username, email, and password are required');
        }

        const emailExists = await User.findOne({ email });
        if (emailExists) {
            res.status(400);
            throw new Error('An account with this email already exists');
        }

        const usernameExists = await User.findOne({ username });
        if (usernameExists) {
            res.status(400);
            throw new Error('An account with this username already exists');
        }

        const member = await User.create({
            username,
            email,
            password,
            role: role || 'Association Member',
            registrationNumber: registrationNumber || undefined,
            phone: phone || undefined,
            gender: gender || 'Male',
            yearAndDept: yearAndDept || 'I B.E. CSE',
            section: section || 'A',
            passoutYear: passoutYear || undefined,
            membershipStatus: membershipStatus || 'Present',
            associationRole: associationRole || '',
            dateOfBirth: dateOfBirth || undefined
        });

        if (member) {
            res.status(201).json({
                _id: member._id,
                username: member.username,
                email: member.email,
                role: member.role,
                registrationNumber: member.registrationNumber,
                phone: member.phone,
                gender: member.gender,
                yearAndDept: member.yearAndDept,
                section: member.section,
                passoutYear: member.passoutYear,
                membershipStatus: member.membershipStatus,
                associationRole: member.associationRole,
                dateOfBirth: member.dateOfBirth
            });
        } else {
            res.status(400);
            throw new Error('Failed to create member account');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Update member status (Admin only)
// @route   PUT /api/auth/member-status/:id
// @access  Private/Admin
exports.updateMemberStatus = async (req, res, next) => {
    try {
        const { membershipStatus } = req.body;
        const user = await User.findById(req.params.id);

        if (user && user.role === 'Association Member') {
            user.membershipStatus = membershipStatus;
            await user.save();
            res.json({ message: `Status updated to ${membershipStatus}` });
        } else {
            res.status(404);
            throw new Error('Member not found or user is not a member');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Move all current association members to past members (Admin only)
// @route   PUT /api/auth/move-all-past
// @access  Private/Admin
exports.moveAllToPastMembers = async (req, res, next) => {
    try {
        const result = await User.updateMany(
            { role: 'Association Member', membershipStatus: 'Present' },
            { membershipStatus: 'Past' }
        );
        res.json({ message: `Successfully moved ${result.modifiedCount} members to past` });
    } catch (error) {
        next(error);
    }
};

// @desc    Create a Faculty account (Admin)
// @route   POST /api/auth/create-faculty
// @access  Private/Admin
exports.createFaculty = async (req, res, next) => {
    try {
        const { 
            username, email, password, employeeId, 
            phone, gender, department, designation, 
            role, assignedYear, assignedSection 
        } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            res.status(400);
            throw new Error('An account with this email already exists');
        }

        const faculty = await User.create({
            username,
            email,
            password,
            role: role || 'Faculty',
            employeeId: employeeId || undefined,
            phone: phone || undefined,
            gender,
            department,
            designation
        });

        if (faculty) {
            res.status(201).json({
                _id: faculty._id,
                username: faculty.username,
                email: faculty.email,
                role: faculty.role,
                employeeId: faculty.employeeId,
                phone: faculty.phone,
                gender: faculty.gender,
                department: faculty.department,
                designation: faculty.designation
            });
        } else {
            res.status(400);
            throw new Error('Failed to create faculty account');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Login user (all roles)
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).select('+password');

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                registrationNumber: user.registrationNumber,
                phone: user.phone,
                bio: user.bio,
                skills: user.skills,
                dateOfBirth: user.dateOfBirth,
                signature: user.signature,
                profileImage: user.profileImage,
                gender: user.gender,
                yearAndDept: user.yearAndDept,
                section: user.section,
                passoutYear: user.passoutYear,
                employeeId: user.employeeId,
                department: user.department,
                designation: user.designation,
                assignedYear: user.assignedYear,
                assignedSection: user.assignedSection,
                reimbursementBalance: user.reimbursementBalance || 0,
                associationRole: user.associationRole || '',
                membershipStatus: user.membershipStatus,
                token: generateToken(user._id),
            });
        } else {
            res.status(401);
            throw new Error('Invalid email or password');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
exports.getProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        if (user) {
            res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                registrationNumber: user.registrationNumber,
                phone: user.phone,
                bio: user.bio,
                skills: user.skills,
                dateOfBirth: user.dateOfBirth,
                signature: user.signature,
                profileImage: user.profileImage,
                gender: user.gender,
                yearAndDept: user.yearAndDept,
                section: user.section,
                passoutYear: user.passoutYear,
                employeeId: user.employeeId,
                department: user.department,
                designation: user.designation,
                assignedYear: user.assignedYear,
                assignedSection: user.assignedSection,
                reimbursementBalance: user.reimbursementBalance || 0,
                associationRole: user.associationRole || '',
                membershipStatus: user.membershipStatus,
            });
        } else {
            res.status(404);
            throw new Error('User not found');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
    try {
        const { username, phone, bio, skills, registrationNumber, dateOfBirth, signature, gender, yearAndDept, section, passoutYear } = req.body;
        const user = await User.findById(req.user._id);

        if (user) {
            user.username = username || user.username;
            user.phone = phone || undefined;
            user.bio = bio !== undefined ? bio : user.bio;
            if (skills !== undefined) {
                user.skills = typeof skills === 'string'
                    ? skills.split(',').map(s => s.trim()).filter(Boolean)
                    : skills;
            }
            user.registrationNumber = registrationNumber || undefined;
            user.dateOfBirth = dateOfBirth || undefined;
            // If signature file was uploaded to Cloudinary, use the secure_url
            if (req.file) {
                user.signature = req.file.path; // Cloudinary secure_url
            } else if (signature) {
                user.signature = signature;
            }
            user.gender = gender || user.gender;
            user.yearAndDept = yearAndDept || user.yearAndDept;
            user.section = section || user.section;
            user.passoutYear = passoutYear !== undefined ? (passoutYear === '' ? undefined : passoutYear) : user.passoutYear;

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                username: updatedUser.username,
                email: updatedUser.email,
                role: updatedUser.role,
                registrationNumber: updatedUser.registrationNumber,
                phone: updatedUser.phone,
                bio: updatedUser.bio,
                skills: updatedUser.skills,
                dateOfBirth: updatedUser.dateOfBirth,
                signature: updatedUser.signature,
                profileImage: updatedUser.profileImage,
                gender: updatedUser.gender,
                yearAndDept: updatedUser.yearAndDept,
                section: updatedUser.section,
                passoutYear: updatedUser.passoutYear,
                employeeId: updatedUser.employeeId,
                department: updatedUser.department,
                designation: updatedUser.designation,
                assignedYear: updatedUser.assignedYear,
                assignedSection: updatedUser.assignedSection,
                token: generateToken(updatedUser._id),
            });
        } else {
            res.status(404);
            throw new Error('User not found');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Get all users (Admin only)
// @route   GET /api/auth/users
// @access  Private/Admin
exports.getAllUsers = async (req, res, next) => {
    try {
        const users = await User.find({}).select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        next(error);
    }
};

// @desc    Update user by ID (Admin only)
// @route   PUT /api/auth/users/:id
// @access  Private/Admin
exports.updateUserById = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            res.status(404);
            throw new Error('User not found');
        }

        const { 
            username, email, role, registrationNumber, phone, 
            gender, yearAndDept, section, passoutYear, employeeId, 
            department, designation, assignedYear, assignedSection,
            membershipStatus, associationRole, dateOfBirth
        } = req.body;

        user.username = username || user.username;
        user.email = email || user.email;
        user.role = role || user.role;
        user.registrationNumber = registrationNumber !== undefined ? (registrationNumber === '' ? undefined : registrationNumber) : user.registrationNumber;
        user.phone = phone !== undefined ? (phone === '' ? undefined : phone) : user.phone;
        user.gender = gender || user.gender;
        user.yearAndDept = yearAndDept || user.yearAndDept;
        user.section = section || user.section;
        user.passoutYear = passoutYear !== undefined ? (passoutYear === '' ? undefined : passoutYear) : user.passoutYear;
        user.employeeId = employeeId !== undefined ? (employeeId === '' ? undefined : employeeId) : user.employeeId;
        user.department = department !== undefined ? department : user.department;
        user.designation = designation !== undefined ? designation : user.designation;
        user.assignedYear = assignedYear !== undefined ? assignedYear : user.assignedYear;
        user.assignedSection = assignedSection !== undefined ? assignedSection : user.assignedSection;
        user.membershipStatus = membershipStatus || user.membershipStatus;
        user.associationRole = associationRole !== undefined ? associationRole : user.associationRole;
        user.dateOfBirth = dateOfBirth !== undefined ? dateOfBirth : user.dateOfBirth;

        user.assignedYear = undefined;
        user.assignedSection = undefined;

        if (req.body.password) {
            user.password = req.body.password;
        }

        const updatedUser = await user.save();
        res.json(updatedUser);
    } catch (error) {
        next(error);
    }
};

// @desc    Delete user by ID (Admin only)
// @route   DELETE /api/auth/users/:id
// @access  Private/Admin
exports.deleteUserById = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            res.status(404);
            throw new Error('User not found');
        }

        if (user.role === 'Admin' && user._id.toString() === req.user._id.toString()) {
            res.status(403);
            throw new Error('Cannot delete your own admin account');
        }

        await user.deleteOne();
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        next(error);
    }
};

// @desc    Upload profile picture
// @route   POST /api/auth/upload-profile
// @access  Private
exports.uploadProfilePicture = async (req, res, next) => {
    try {
        if (!req.file) {
            res.status(400);
            throw new Error('No file uploaded');
        }

        const user = await User.findById(req.user._id);
        if (user) {
            user.profileImage = req.file.path; // Cloudinary secure_url
            await user.save();
            res.json({
                profileImage: req.file.path,
                profileImageUrl: req.file.path
            });
        } else {
            res.status(404);
            throw new Error('User not found');
        }
    } catch (error) {
        next(error);
    }
};

// Signature upload — stored in Cloudinary under event_management/signatures
const signatureUpload = createCloudinaryUpload('signatures', ['jpeg', 'jpg', 'png', 'gif', 'webp'], 1, 'signature-');


// @desc    Update password
// @route   PUT /api/auth/update-password
// @access  Private
exports.updatePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id).select('+password');

        if (!user) {
            res.status(404);
            throw new Error('User not found');
        }

        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) {
            res.status(401);
            throw new Error('Current password is incorrect');
        }

        user.password = newPassword;
        await user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        next(error);
    }
};

// @desc    Search for users
// @route   GET /api/auth/search
// @access  Private
exports.searchUsers = async (req, res, next) => {
    try {
        const query = req.query.q;
        if (!query) {
            return res.json([]);
        }

        const users = await User.find({
            $and: [
                { _id: { $ne: req.user._id } }, // Exclude self
                {
                    $or: [
                        { username: { $regex: query, $options: 'i' } },
                        { email: { $regex: query, $options: 'i' } },
                        { registrationNumber: { $regex: query, $options: 'i' } }
                    ]
                }
            ]
        }).select('username email registrationNumber').limit(10);

        res.json(users);
    } catch (error) {
        next(error);
    }
};

// @desc    Get public list of association members (for homepage display)
// @route   GET /api/auth/association-members
// @access  Public
exports.getPublicAssociationMembers = async (req, res, next) => {
    try {
        const members = await User.find({
            role: { $in: ['Admin', 'Association Member', 'Student Coordinator'] },
            membershipStatus: 'Present'
        })
        .select('username role yearAndDept section designation profileImage bio associationRole')
        .sort({ role: 1, username: 1 });
        res.json(members);
    } catch (error) {
        next(error);
    }
};

// Export upload middleware for use in routes
exports.upload = upload;
exports.signatureUpload = signatureUpload;

// @desc    Get students in a teacher's assigned class/section with event registration & attendance statistics
// @route   GET /api/auth/class-students
// @access  Private (Admin)
exports.getClassStudents = async (req, res, next) => {
    try {
        let filter = {
            role: { $in: ['Participant', 'Association Member', 'Student Coordinator'] }
        };

        const students = await User.find(filter).select('-password').sort({ registrationNumber: 1 });

        const Registration = require('../models/Registration');
        const stats = await Registration.aggregate([
            {
                $group: {
                    _id: '$participant',
                    registrationCount: { $sum: 1 },
                    attendanceCount: {
                        $sum: { $cond: [{ $eq: ['$attendanceStatus', true] }, 1, 0] }
                    }
                }
            }
        ]);

        const statsMap = {};
        stats.forEach(s => {
            if (s._id) {
                statsMap[s._id.toString()] = {
                    registrationCount: s.registrationCount,
                    attendanceCount: s.attendanceCount
                };
            }
        });

        const studentsWithStats = students.map(student => {
            const studentId = student._id.toString();
            const studentStats = statsMap[studentId] || { registrationCount: 0, attendanceCount: 0 };
            return {
                ...student.toObject(),
                registrationCount: studentStats.registrationCount,
                attendanceCount: studentStats.attendanceCount
            };
        });

        res.json(studentsWithStats);
    } catch (error) {
        next(error);
    }
};

// @desc    Request password reset - verify email
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email }).select('+securityQuestions');

        if (!user) {
            res.status(404);
            throw new Error('No account found with this email');
        }

        if (!user.securityQuestions || !user.securityQuestions.bestFriendName) {
            res.status(400);
            throw new Error('Security questions not set for this account. Please contact administrator.');
        }

        // Return success but don't reveal if user exists for security
        res.json({
            message: 'Email found. Please answer security questions to proceed.',
            email: user.email
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Verify security answers
// @route   POST /api/auth/verify-security-answers
// @access  Public
exports.verifySecurityAnswers = async (req, res, next) => {
    try {
        const { email, securityAnswers } = req.body;
        const user = await User.findOne({ email }).select('+securityQuestions');

        if (!user) {
            res.status(404);
            throw new Error('No account found with this email');
        }

        const isMatch = user.matchSecurityAnswers(securityAnswers);

        if (!isMatch) {
            res.status(401);
            throw new Error('Security answers do not match. Please try again.');
        }

        // Generate a temporary reset token
        const resetToken = generateToken(user._id);

        res.json({
            message: 'Security answers verified. You can now reset your password.',
            resetToken,
            userId: user._id
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res, next) => {
    try {
        const { resetToken, userId, newPassword } = req.body;

        // Verify token
        const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
        if (decoded.id !== userId) {
            res.status(401);
            throw new Error('Invalid reset token');
        }

        const user = await User.findById(userId);

        if (!user) {
            res.status(404);
            throw new Error('User not found');
        }

        user.password = newPassword;
        await user.save();

        res.json({
            message: 'Password reset successfully. Please login with your new password.'
        });
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            res.status(401);
            error.message = 'Invalid or expired reset token';
        }
        next(error);
    }
};
