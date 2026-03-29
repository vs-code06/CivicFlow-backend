import express from 'express';
import { getDashboardStats } from '../controllers/dashboardController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

// @ts-ignore
router.get('/stats', protect, authorize('admin'), getDashboardStats);

export default router;
