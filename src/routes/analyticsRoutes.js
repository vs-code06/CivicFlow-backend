const express = require('express');
const router = express.Router();
const { 
    getCollectionTrends, 
    getWasteComposition, 
    getZonePerformance,
    getOperationalMetrics
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All analytics routes are protected and restricted to admin
router.use(protect);
router.use(authorize('admin'));

router.get('/trends', getCollectionTrends);
router.get('/composition', getWasteComposition);
router.get('/zone-performance', getZonePerformance);
router.get('/metrics', getOperationalMetrics);

module.exports = router;
