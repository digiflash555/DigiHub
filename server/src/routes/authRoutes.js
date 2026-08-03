const express = require('express');
const router = express.Router();
const {
    register, login, getProfile, updateProfile,
    createAssociationMember, createFaculty,
    updateMemberStatus, moveAllToPastMembers,
    getAllUsers, updateUserById, deleteUserById,
    uploadProfilePicture, upload, signatureUpload, searchUsers, updatePassword,
    getClassStudents, forgotPassword, verifySecurityAnswers, resetPassword,
    getPublicAssociationMembers
} = require('../controllers/authController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/verify-security-answers', verifySecurityAnswers);
router.post('/reset-password', resetPassword);
router.get('/association-members', getPublicAssociationMembers);

// Private routes
router.get('/profile', protect, getProfile);
router.get('/search', protect, searchUsers);
router.put('/update-password', protect, updatePassword);
router.put('/profile', protect, signatureUpload.single('signature'), updateProfile);
router.post('/upload-profile', protect, upload.single('profileImage'), uploadProfilePicture);
router.get('/class-students', protect, authorize('Admin'), getClassStudents);

// Admin-only routes
router.post('/create-association-member', protect, authorize('Admin'), createAssociationMember);
router.post('/create-faculty', protect, authorize('Admin'), createFaculty);
router.put('/member-status/:id', protect, authorize('Admin'), updateMemberStatus);
router.put('/move-all-past', protect, authorize('Admin'), moveAllToPastMembers);
router.get('/users', protect, authorize('Admin'), getAllUsers);
router.put('/users/:id', protect, authorize('Admin'), updateUserById);
router.delete('/users/:id', protect, authorize('Admin'), deleteUserById);

module.exports = router;
