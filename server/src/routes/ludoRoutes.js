const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { recordResult, getHistory } = require('../controllers/ludoController');

router.use(protect);

router.post('/result', recordResult);
router.get('/history', getHistory);

module.exports = router;
