const express = require('express');
const router = express.Router();
const { getZones, getMyZone, getZoneById, createZone, updateZone, addAreaToZone, updateZoneSchedule, getZoneScheduleStatus } = require('../controllers/zoneController');
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

// Schedule management
router.put('/:id/schedule', authorize('admin'), updateZoneSchedule);
router.get('/:id/schedule-status', getZoneScheduleStatus);

router.post('/:id/areas', authorize('admin'), addAreaToZone);

module.exports = router;
