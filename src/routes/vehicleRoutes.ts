import express from 'express';
import { 
    getVehicles, createVehicle, updateVehicle, 
    deleteVehicle, assignDriver 
} from '../controllers/vehicleController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

// Get all (admin + personnel can view), Create (admin only)
router.route('/')
    // @ts-ignore
    .get(protect, authorize('admin', 'personnel'), getVehicles)
    // @ts-ignore
    .post(protect, authorize('admin'), createVehicle);

// Update, Delete (admin only)
router.route('/:id')
    // @ts-ignore
    .put(protect, authorize('admin'), updateVehicle)
    // @ts-ignore
    .delete(protect, authorize('admin'), deleteVehicle);

// Assign driver (admin only)
// @ts-ignore
router.route('/:id/assign').put(protect, authorize('admin'), assignDriver);

export default router;
