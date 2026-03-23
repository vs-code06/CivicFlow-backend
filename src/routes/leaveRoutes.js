const express = require('express');
const router = express.Router();
const { createLeaveRequest, getLeaveRequests, updateLeaveStatus } = require('../controllers/leaveController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
    .get(authorize('admin', 'personnel'), getLeaveRequests)
    .post(authorize('personnel'), createLeaveRequest);

router.route('/:id')
    .put(authorize('admin', 'personnel'), updateLeaveStatus);

module.exports = router;
