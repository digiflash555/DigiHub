const express = require('express');
const router = express.Router();
const { getSettings, updateSettings, upload } = require('../controllers/settingsController');
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

module.exports = router;
