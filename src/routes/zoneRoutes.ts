import express from 'express';
import { 
    getZones, getMyZone, getZoneById, 
    createZone, updateZone, addAreaToZone, 
    updateZoneSchedule, getZoneScheduleStatus 
} from '../controllers/zoneController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

// @ts-ignore
router.use(protect);

// GET /zones/my — resident fetches their assigned zone
// @ts-ignore
router.get('/my', authorize('resident', 'personnel', 'admin'), getMyZone);

router.route('/')
    .get(getZones)
    .post(authorize('admin'), createZone);

router.route('/:id')
    .get(getZoneById)
    .put(authorize('admin'), updateZone);

// Schedule management
router.put('/:id/schedule', authorize('admin'), updateZoneSchedule);
router.get('/:id/schedule-status', getZoneScheduleStatus);

router.post('/:id/areas', authorize('admin'), addAreaToZone);

export default router;
