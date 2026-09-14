const express = require('express');
const router = express.Router();
const { getSettings, updateSettings, upload, promoteStudents, revertStudents, deleteGraduatedStudents } = require('../controllers/settingsController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.route('/')
    .get(getSettings)
    .put(
        protect, 
        authorize('Admin'), 
        upload.fields([
            { name: 'iicLogo', maxCount: 1 },
            { name: 'digiflashLogo', maxCount: 1 },
            { name: 'associationCoordinatorSign', maxCount: 1 },
            { name: 'hodSign', maxCount: 1 }
        ]), 
        updateSettings
    );

router.route('/promote-students')
    .post(protect, authorize('Admin'), promoteStudents);

router.route('/revert-students')
    .post(protect, authorize('Admin'), revertStudents);

router.route('/delete-graduated')
    .delete(protect, authorize('Admin'), deleteGraduatedStudents);

module.exports = router;
