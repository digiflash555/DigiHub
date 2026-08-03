const RegistrationTemplate = require('../models/RegistrationTemplate');

// Helper to log actions
const logAction = (user, action, templateId, details = '') => {
    console.log(`[AUDIT LOG] [${new Date().toISOString()}] User: ${user.username} (${user.role}) - Action: ${action} - Template ID: ${templateId || 'N/A'} - Details: ${details}`);
};

// @desc    Create a new registration template
// @route   POST /api/templates
// @access  Private (Admin/Coordinators)
exports.createTemplate = async (req, res, next) => {
    try {
        const { templateName, description, category, status, fields, version } = req.body;

        const template = new RegistrationTemplate({
            templateName,
            description,
            category,
            status: status || 'Active',
            fields: fields || [],
            version: version || 1,
            createdBy: req.user._id
        });

        await template.save();
        logAction(req.user, 'CREATE_TEMPLATE', template._id, `Name: ${template.templateName}`);
        
        res.status(201).json(template);
    } catch (error) {
        next(error);
    }
};

// @desc    Get all registration templates with search and filter
// @route   GET /api/templates
// @access  Private (Admin/Coordinators)
exports.getTemplates = async (req, res, next) => {
    try {
        const { search, category, status } = req.query;
        let query = {};

        if (search) {
            query.templateName = { $regex: search, $options: 'i' };
        }
        if (category) {
            query.category = category;
        }
        if (status) {
            query.status = status;
        }

        const templates = await RegistrationTemplate.find(query)
            .populate('createdBy', 'username email')
            .sort({ createdAt: -1 });

        res.json(templates);
    } catch (error) {
        next(error);
    }
};

// @desc    Get single registration template by ID
// @route   GET /api/templates/:id
// @access  Private (Admin/Coordinators)
exports.getTemplateById = async (req, res, next) => {
    try {
        const template = await RegistrationTemplate.findById(req.params.id)
            .populate('createdBy', 'username email');

        if (!template) {
            res.status(404);
            throw new Error('Template not found');
        }

        res.json(template);
    } catch (error) {
        next(error);
    }
};

// @desc    Update a registration template
// @route   PUT /api/templates/:id
// @access  Private (Admin/Coordinators)
exports.updateTemplate = async (req, res, next) => {
    try {
        const { templateName, description, category, status, fields, version } = req.body;
        let template = await RegistrationTemplate.findById(req.params.id);

        if (!template) {
            res.status(404);
            throw new Error('Template not found');
        }

        // Only allowed if Admin or the creator
        if (template.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
            res.status(403);
            throw new Error('Not authorized to update this template');
        }

        template.templateName = templateName || template.templateName;
        template.description = description !== undefined ? description : template.description;
        template.category = category || template.category;
        template.status = status || template.status;
        template.fields = fields || template.fields;
        template.version = version || template.version;

        await template.save();
        logAction(req.user, 'UPDATE_TEMPLATE', template._id, `Name: ${template.templateName}`);

        res.json(template);
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a registration template
// @route   DELETE /api/templates/:id
// @access  Private (Admin/Coordinators)
exports.deleteTemplate = async (req, res, next) => {
    try {
        const template = await RegistrationTemplate.findById(req.params.id);

        if (!template) {
            res.status(404);
            throw new Error('Template not found');
        }

        // Only allowed if Admin or the creator
        if (template.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
            res.status(403);
            throw new Error('Not authorized to delete this template');
        }

        const name = template.templateName;
        await template.deleteOne();
        logAction(req.user, 'DELETE_TEMPLATE', req.params.id, `Name: ${name}`);

        res.json({ message: 'Template removed successfully' });
    } catch (error) {
        next(error);
    }
};

// @desc    Duplicate a registration template
// @route   POST /api/templates/:id/duplicate
// @access  Private (Admin/Coordinators)
exports.duplicateTemplate = async (req, res, next) => {
    try {
        const template = await RegistrationTemplate.findById(req.params.id);

        if (!template) {
            res.status(404);
            throw new Error('Template not found');
        }

        const duplicated = new RegistrationTemplate({
            templateName: `${template.templateName} (Copy)`,
            description: template.description,
            category: template.category,
            status: template.status,
            fields: template.fields,
            version: template.version,
            createdBy: req.user._id
        });

        await duplicated.save();
        logAction(req.user, 'DUPLICATE_TEMPLATE', template._id, `New template ID: ${duplicated._id}`);

        res.status(201).json(duplicated);
    } catch (error) {
        next(error);
    }
};
