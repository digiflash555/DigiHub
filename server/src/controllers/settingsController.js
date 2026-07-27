const Settings = require('../models/Settings');
const { createCloudinaryUpload } = require('../utils/cloudinaryUpload');

// Logos and signatures upload — stored in Cloudinary under event_management/settings
const upload = createCloudinaryUpload('settings', ['jpeg', 'jpg', 'png', 'webp', 'gif'], 1, 'logo-');

// @desc    Get settings
// @route   GET /api/settings
// @access  Public
exports.getSettings = async (req, res, next) => {
    try {
        const settings = await Settings.getSettings();
        res.json(settings);
    } catch (error) {
        next(error);
    }
};

// @desc    Update settings
// @route   PUT /api/settings
// @access  Admin
exports.updateSettings = async (req, res, next) => {
    try {
        const settings = await Settings.getSettings();
        const updateData = { ...req.body };

        if (req.files) {
            if (req.files.iicLogo && req.files.iicLogo[0]) {
                updateData.iicLogo = req.files.iicLogo[0].path;
            }
            if (req.files.digiflashLogo && req.files.digiflashLogo[0]) {
                updateData.digiflashLogo = req.files.digiflashLogo[0].path;
            }
            if (req.files.associationCoordinatorSign && req.files.associationCoordinatorSign[0]) {
                updateData.associationCoordinatorSign = req.files.associationCoordinatorSign[0].path;
            }
            if (req.files.hodSign && req.files.hodSign[0]) {
                updateData.hodSign = req.files.hodSign[0].path;
            }
        }

        Object.assign(settings, updateData);
        await settings.save();
        res.json(settings);
    } catch (error) {
        next(error);
    }
};

exports.upload = upload;

