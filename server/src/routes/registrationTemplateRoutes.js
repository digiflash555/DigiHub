const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const {
    createTemplate,
    getTemplates,
    getTemplateById,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate
} = require('../controllers/registrationTemplateController');

// Protect all template routes
router.use(protect);

// Allow admins, faculty, and coordinates/association members to manage templates
const allowedRoles = ['Admin', 'Faculty', 'Faculty Coordinator', 'Student Coordinator', 'Association Member', 'Class Coordinator', 'Program Coordinator'];

router.route('/')
    .post(authorize(...allowedRoles), createTemplate)
    .get(authorize(...allowedRoles), getTemplates);

router.route('/:id')
    .get(authorize(...allowedRoles), getTemplateById)
    .put(authorize(...allowedRoles), updateTemplate)
    .delete(authorize(...allowedRoles), deleteTemplate);

router.post('/:id/duplicate', authorize(...allowedRoles), duplicateTemplate);

module.exports = router;
