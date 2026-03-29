import express from 'express';
import {
    getTasks, getTaskById, getResidentZoneStatus, getTaskStats,
    createTask, updateTask, acceptTask, startTask, completeTask, deleteTask, dispatchToday
} from '../controllers/taskController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

// @ts-ignore
router.use(protect);

// Special routes first (before /:id to avoid conflicts)
router.get('/stats', authorize('admin'), getTaskStats);
// @ts-ignore
router.get('/my-zone-status', authorize('resident'), getResidentZoneStatus);
// @ts-ignore
router.post('/dispatch-today', authorize('admin'), dispatchToday);

// Main CRUD
router.route('/')
    // @ts-ignore
    .get(authorize('admin', 'personnel'), getTasks)
    // @ts-ignore
    .post(authorize('admin'), createTask);

router.route('/:id')
    // @ts-ignore
    .get(authorize('admin', 'personnel'), getTaskById)
    // @ts-ignore
    .put(authorize('admin', 'personnel'), updateTask)
    // @ts-ignore
    .delete(authorize('admin'), deleteTask);

// Personnel-specific task lifecycle
// @ts-ignore
router.post('/:id/accept', authorize('personnel'), acceptTask);
// @ts-ignore
router.post('/:id/start', authorize('personnel'), startTask);
// @ts-ignore
router.post('/:id/complete', authorize('personnel'), completeTask);

export default router;
