const express = require('express');
const router = express.Router();
const {
    getComplaints, getComplaintStats, getComplaintById,
    createComplaint, updateComplaint, deleteComplaint
} = require('../controllers/complaintController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/stats', getComplaintStats);

router.route('/')
    .get(getComplaints)                             // All roles (scoped by role in controller)
    .post(authorize('resident'), createComplaint);   // Only residents file complaints

router.route('/:id')
    .get(getComplaintById)
    .put(authorize('admin', 'personnel'), updateComplaint)
    .delete(authorize('resident'), deleteComplaint); // Resident can cancel own pending

module.exports = router;
