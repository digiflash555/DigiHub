const express = require('express');
const router = express.Router();
const { 
    publishWinners, getWinnersByEvent, createWinner, deleteWinner, getAllWinners,
    getMyWinnerStatus, uploadWinnerPhoto, deleteWinnerPhoto, lockWinnerPhotos, lockSingleWinnerPhoto,
    likeWinner, commentWinner, likeComment, replyToComment, likeReply
} = require('../controllers/winnerController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { createCloudinaryUpload } = require('../utils/cloudinaryUpload');

const upload = createCloudinaryUpload('winner-photos', ['jpg', 'jpeg', 'png', 'webp'], 5, 'winner-photo-');

router.get('/my-status', protect, getMyWinnerStatus);

router.get('/', getAllWinners);
router.post('/', protect, authorize('Admin'), publishWinners);
router.post('/single', protect, authorize('Admin'), createWinner);
router.get('/event/:eventId', getWinnersByEvent);
router.delete('/:id', protect, authorize('Admin'), deleteWinner);

router.post('/:id/photo', protect, upload.single('photo'), uploadWinnerPhoto);
router.delete('/:id/photo', protect, authorize('Admin'), deleteWinnerPhoto);
router.patch('/:id/lock-photo', protect, authorize('Admin'), lockSingleWinnerPhoto);
router.patch('/event/:eventId/lock-photos', protect, authorize('Admin'), lockWinnerPhotos);

router.post('/:id/like', protect, likeWinner);
router.post('/:id/comment', protect, commentWinner);
router.post('/:id/comment/:commentId/like', protect, likeComment);
router.post('/:id/comment/:commentId/reply', protect, replyToComment);
router.post('/:id/comment/:commentId/reply/:replyId/like', protect, likeReply);

module.exports = router;
