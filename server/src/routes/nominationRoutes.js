const express = require('express');
const router = express.Router();
const { 
    submitNomination, 
    getNominations, 
    approveNomination, 
    getNominationById,
    createNominationForm,
    getNominationForms,
    updateNominationForm,
    deleteNominationForm,
    updateNomination,
    deleteNomination,
    exportNominationPDF,
    exportAllNominationsPDF,
    exportAllNominationsXLSX,
    exportNominationXLSX
} = require('../controllers/nominationController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { createCloudinaryUpload } = require('../utils/cloudinaryUpload');

// Candidate photo upload — stored in Cloudinary under event_management/nominations
const upload = createCloudinaryUpload('nominations', ['jpeg', 'jpg', 'png', 'webp'], 1, 'candidate-photo-');

router.use(protect);

router.post('/upload-photo', upload.single('photo'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Please upload a photo' });
    }
    res.json({ filename: req.file.path });
});

router.post('/forms', authorize('Admin'), createNominationForm);
router.get('/forms', getNominationForms);
router.put('/forms/:id', authorize('Admin'), updateNominationForm);
router.delete('/forms/:id', authorize('Admin'), deleteNominationForm);

// IMPORTANT: export routes MUST come before generic :id routes
router.get('/export/pdf', authorize('Admin'), exportAllNominationsPDF);
router.get('/export/xlsx', authorize('Admin'), exportAllNominationsXLSX);
router.get('/:id/xlsx', authorize('Admin', 'Class Coordinator', 'Program Coordinator'), exportNominationXLSX);


router.post('/', submitNomination);
router.get('/', getNominations);
router.get('/:id/pdf', authorize('Admin'), exportNominationPDF);
// IMPORTANT: specific sub-routes (:id/approve) MUST come before generic (:id) routes
router.put('/:id/approve', authorize('Admin', 'Class Coordinator', 'Program Coordinator'), approveNomination);
router.get('/:id', getNominationById);
router.put('/:id', authorize('Admin'), updateNomination);
router.delete('/:id', authorize('Admin'), deleteNomination);

module.exports = router;
