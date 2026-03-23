const express = require('express');
const router = express.Router();
const { getZones, getMyZone, getZoneById, createZone, updateZone, addAreaToZone } = require('../controllers/zoneController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All zone routes are protected
router.use(protect);

// GET /zones/my — resident fetches their assigned zone
router.get('/my', authorize('resident', 'personnel', 'admin'), getMyZone);

router.route('/')
    .get(getZones)                              // All authenticated users
    .post(authorize('admin'), createZone);       // Admin only

router.route('/:id')
    .get(getZoneById)                            // All authenticated users
    .put(authorize('admin'), updateZone);         // Admin only

router.post('/:id/areas', authorize('admin'), addAreaToZone);

module.exports = router;
