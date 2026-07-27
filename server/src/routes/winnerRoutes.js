const express = require('express');
const router = express.Router();
const { publishWinners, getWinnersByEvent, createWinner, deleteWinner, getAllWinners } = require('../controllers/winnerController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.get('/', getAllWinners);
router.post('/', protect, authorize('Admin'), publishWinners);
router.post('/single', protect, authorize('Admin'), createWinner);
router.get('/event/:eventId', getWinnersByEvent);
router.delete('/:id', protect, authorize('Admin'), deleteWinner);

module.exports = router;
