import express from 'express';
import { 
    getCollectionTrends, getWasteComposition, 
    getZonePerformance, getOperationalMetrics 
} from '../controllers/analyticsController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/trends', getCollectionTrends);
router.get('/composition', getWasteComposition);
router.get('/zone-performance', getZonePerformance);
router.get('/metrics', getOperationalMetrics);

export default router;
