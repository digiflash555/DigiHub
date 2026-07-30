const Settings = require('../models/Settings');
const User = require('../models/User');
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

// @desc    Promote Participant students to next year (not Association Members)
// @route   POST /api/settings/promote-students
// @access  Admin
exports.promoteStudents = async (req, res, next) => {
    try {
        // Only Participant role — Association Members are excluded
        const students = await User.find({ role: 'Participant' });
        let promotedCount = 0;

        const bulkOps = [];
        students.forEach(student => {
            if (!student.yearAndDept) return;
            let newYearAndDept = student.yearAndDept;

            if (newYearAndDept.startsWith('III ')) {
                newYearAndDept = newYearAndDept.replace('III ', 'IV ');
            } else if (newYearAndDept.startsWith('II ')) {
                newYearAndDept = newYearAndDept.replace('II ', 'III ');
            } else if (newYearAndDept.startsWith('I ')) {
                newYearAndDept = newYearAndDept.replace('I ', 'II ');
            }
            // IV year students are skipped (remain unchanged)

            if (newYearAndDept !== student.yearAndDept) {
                bulkOps.push({
                    updateOne: {
                        filter: { _id: student._id },
                        update: { $set: { yearAndDept: newYearAndDept } }
                    }
                });
                promotedCount++;
            }
        });

        if (bulkOps.length > 0) {
            await User.bulkWrite(bulkOps);
        }

        res.json({ message: `Successfully promoted ${promotedCount} students to the next year.`, promotedCount });
    } catch (error) {
        next(error);
    }
};

// @desc    Revert Participant students to previous year (not Association Members)
// @route   POST /api/settings/revert-students
// @access  Admin
exports.revertStudents = async (req, res, next) => {
    try {
        const students = await User.find({ role: 'Participant' });
        let revertedCount = 0;

        const bulkOps = [];
        students.forEach(student => {
            if (!student.yearAndDept) return;
            let newYearAndDept = student.yearAndDept;

            if (newYearAndDept.startsWith('IV ')) {
                newYearAndDept = newYearAndDept.replace('IV ', 'III ');
            } else if (newYearAndDept.startsWith('III ')) {
                newYearAndDept = newYearAndDept.replace('III ', 'II ');
            } else if (newYearAndDept.startsWith('II ')) {
                newYearAndDept = newYearAndDept.replace('II ', 'I ');
            }
            // I year students are skipped (remain unchanged)

            if (newYearAndDept !== student.yearAndDept) {
                bulkOps.push({
                    updateOne: {
                        filter: { _id: student._id },
                        update: { $set: { yearAndDept: newYearAndDept } }
                    }
                });
                revertedCount++;
            }
        });

        if (bulkOps.length > 0) {
            await User.bulkWrite(bulkOps);
        }

        res.json({ message: `Successfully reverted ${revertedCount} students to the previous year.`, revertedCount });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete graduated students by passout year (Participants only, not Association Members)
// @route   DELETE /api/settings/delete-graduated
// @access  Admin
exports.deleteGraduatedStudents = async (req, res, next) => {
    try {
        const { passoutYear } = req.body;
        if (!passoutYear) {
            res.status(400);
            throw new Error('Passout year is required');
        }

        const result = await User.deleteMany({
            role: 'Participant',
            passoutYear: Number(passoutYear)
        });

        res.json({
            message: `Successfully deleted ${result.deletedCount} graduated student(s) with passout year ${passoutYear}.`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        next(error);
    }
};
