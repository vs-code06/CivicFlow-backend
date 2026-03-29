import express from 'express';
import {
    getComplaints, getComplaintStats, getComplaintById,
    createComplaint, updateComplaint, deleteComplaint
} from '../controllers/complaintController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

// @ts-ignore
router.use(protect);

router.get('/stats', getComplaintStats);

router.route('/')
    // @ts-ignore
    .get(getComplaints)                             // All roles (scoped by role in controller)
    // @ts-ignore
    .post(authorize('resident'), createComplaint);   // Only residents file complaints

router.route('/:id')
    // @ts-ignore
    .get(getComplaintById)
    // @ts-ignore
    .put(authorize('admin', 'personnel'), updateComplaint)
    // @ts-ignore
    .delete(authorize('resident'), deleteComplaint); // Resident can cancel own pending

export default router;
