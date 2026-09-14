const FeedbackTemplate = require('../models/FeedbackTemplate');

// @desc    Create a new feedback template
// @route   POST /api/feedback-templates
// @access  Private (Admin/Faculty)
exports.createTemplate = async (req, res) => {
    try {
        const { name, description, fields } = req.body;

        const template = new FeedbackTemplate({
            name,
            description,
            fields,
            createdBy: req.user._id
        });

        await template.save();
        res.status(201).json(template);
    } catch (error) {
        console.error('Error creating feedback template:', error);
        res.status(500).json({ message: 'Server error creating template' });
    }
};

// @desc    Get all feedback templates
// @route   GET /api/feedback-templates
// @access  Private (Admin/Faculty)
exports.getTemplates = async (req, res) => {
    try {
        const templates = await FeedbackTemplate.find()
            .populate('createdBy', 'username email')
            .sort({ createdAt: -1 });
        res.json(templates);
    } catch (error) {
        console.error('Error fetching templates:', error);
        res.status(500).json({ message: 'Server error fetching templates' });
    }
};

// @desc    Get single feedback template
// @route   GET /api/feedback-templates/:id
// @access  Private
exports.getTemplateById = async (req, res) => {
    try {
        const template = await FeedbackTemplate.findById(req.params.id)
            .populate('createdBy', 'username email');
        
        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }

        res.json(template);
    } catch (error) {
        console.error('Error fetching template:', error);
        res.status(500).json({ message: 'Server error fetching template' });
    }
};

// @desc    Update a feedback template
// @route   PUT /api/feedback-templates/:id
// @access  Private (Admin/Faculty)
exports.updateTemplate = async (req, res) => {
    try {
        const { name, description, fields } = req.body;

        let template = await FeedbackTemplate.findById(req.params.id);

        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }

        // Only allow creator or Admin to update
        if (template.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Not authorized to update this template' });
        }

        template.name = name || template.name;
        template.description = description !== undefined ? description : template.description;
        template.fields = fields || template.fields;

        await template.save();
        res.json(template);
    } catch (error) {
        console.error('Error updating template:', error);
        res.status(500).json({ message: 'Server error updating template' });
    }
};

// @desc    Delete a feedback template
// @route   DELETE /api/feedback-templates/:id
// @access  Private (Admin/Faculty)
exports.deleteTemplate = async (req, res) => {
    try {
        const template = await FeedbackTemplate.findById(req.params.id);

        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }

        // Only allow creator or Admin to delete
        if (template.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Not authorized to delete this template' });
        }

        await template.deleteOne();
        res.json({ message: 'Template removed successfully' });
    } catch (error) {
        console.error('Error deleting template:', error);
        res.status(500).json({ message: 'Server error deleting template' });
    }
};
