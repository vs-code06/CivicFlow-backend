const express = require('express');
const router = express.Router();
const {
    getTasks, getTaskById, getResidentZoneStatus, getTaskStats,
    createTask, updateTask, acceptTask, startTask, completeTask, deleteTask, dispatchToday
} = require('../controllers/taskController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All task routes require authentication
router.use(protect);

// Special routes first (before /:id to avoid conflicts)
router.get('/stats', authorize('admin'), getTaskStats);
router.get('/my-zone-status', authorize('resident'), getResidentZoneStatus);
router.post('/dispatch-today', authorize('admin'), dispatchToday);

// Main CRUD
router.route('/')
    .get(authorize('admin', 'personnel'), getTasks)
    .post(authorize('admin'), createTask);

router.route('/:id')
    .get(authorize('admin', 'personnel'), getTaskById)
    .put(authorize('admin', 'personnel'), updateTask)
    .delete(authorize('admin'), deleteTask);

// Personnel-specific task lifecycle
router.post('/:id/accept', authorize('personnel'), acceptTask);
router.post('/:id/start', authorize('personnel'), startTask);
router.post('/:id/complete', authorize('personnel'), completeTask);

module.exports = router;
