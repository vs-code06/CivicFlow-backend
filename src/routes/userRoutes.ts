import express from 'express';
import {
    getPersonnel, getAllUsers, updateStatus,
    updateUserRole, deleteUser, getLeaveRequests
} from '../controllers/userController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

// @ts-ignore
router.use(protect);

// Personnel-accessible
router.get('/personnel', authorize('admin', 'personnel'), getPersonnel);
// @ts-ignore
router.put('/status', authorize('personnel'), updateStatus);

// Admin-only
router.get('/', authorize('admin'), getAllUsers);
router.get('/leave-requests', authorize('admin'), getLeaveRequests);
router.put('/:id/role', authorize('admin'), updateUserRole);
// @ts-ignore
router.delete('/:id', authorize('admin'), deleteUser);

export default router;
