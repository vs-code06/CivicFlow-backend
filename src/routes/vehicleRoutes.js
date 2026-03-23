const express = require('express');
const router = express.Router();
const { getVehicles, createVehicle, updateVehicle, deleteVehicle, assignDriver } = require('../controllers/vehicleController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Get all (admin + personnel can view), Create (admin only)
router.route('/').get(protect, authorize('admin', 'personnel'), getVehicles).post(protect, authorize('admin'), createVehicle);

// Update, Delete (admin only)
router.route('/:id').put(protect, authorize('admin'), updateVehicle).delete(protect, authorize('admin'), deleteVehicle);

// Assign driver (admin only)
router.route('/:id/assign').put(protect, authorize('admin'), assignDriver);

module.exports = router;
