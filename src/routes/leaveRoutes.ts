import express from 'express';
import { createLeaveRequest, getLeaveRequests, updateLeaveStatus } from '../controllers/leaveController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

// All leave routes require authentication
router.use(protect);

router.route('/')
    .get(getLeaveRequests) // Admin: all, Personnel: their own
    // @ts-ignore
    .post(authorize('personnel'), createLeaveRequest);

router.route('/:id')
    // @ts-ignore
    .put(authorize('admin', 'personnel'), updateLeaveStatus);

export default router;
