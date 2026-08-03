const express = require('express');
const router = express.Router();
const { 
    submitQuery, 
    getQueries, 
    getMyQueries, 
    updateQueryStatus 
} = require('../controllers/supportController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect);

router.post('/', submitQuery);
router.get('/my', getMyQueries);
router.get('/', authorize('Admin'), getQueries);
router.put('/:id', authorize('Admin'), updateQueryStatus);

module.exports = router;
