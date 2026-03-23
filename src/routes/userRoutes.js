const express = require('express');
const router = express.Router();
const {
    getPersonnel, getAllUsers, updateStatus,
    updateUserRole, deleteUser, getLeaveRequests
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

// Personnel-accessible
router.get('/personnel', authorize('admin', 'personnel'), getPersonnel);
router.put('/status', authorize('personnel'), updateStatus);

// Admin-only
router.get('/', authorize('admin'), getAllUsers);
router.get('/leave-requests', authorize('admin'), getLeaveRequests);
router.put('/:id/role', authorize('admin'), updateUserRole);
router.delete('/:id', authorize('admin'), deleteUser);

module.exports = router;
