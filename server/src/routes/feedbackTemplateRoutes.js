const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const {
    createTemplate,
    getTemplates,
    getTemplateById,
    updateTemplate,
    deleteTemplate
} = require('../controllers/feedbackTemplateController');

// All routes require authentication
router.use(protect);

// Routes
router.route('/')
    .post(authorize('Admin', 'Faculty', 'Program Coordinator'), createTemplate)
    .get(authorize('Admin', 'Faculty', 'Program Coordinator'), getTemplates);

router.route('/:id')
    .get(authorize('Admin', 'Faculty', 'Program Coordinator'), getTemplateById)
    .put(authorize('Admin', 'Faculty', 'Program Coordinator'), updateTemplate)
    .delete(authorize('Admin', 'Faculty', 'Program Coordinator'), deleteTemplate);

module.exports = router;
