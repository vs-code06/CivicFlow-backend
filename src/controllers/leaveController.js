const LeaveRequest = require('../models/LeaveRequest');
const User = require('../models/User');

// ─── POST /api/leaves ─────────────────────────────────────────────────────────
// Personnel only
const createLeaveRequest = async (req, res) => {
    try {
        const { type, startDate, endDate, reason } = req.body;
        if (!type || !startDate || !endDate || !reason) {
            return res.status(400).json({ success: false, message: 'Type, start date, end date, and reason are required' });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        if (end < start) {
            return res.status(400).json({ success: false, message: 'End date must be after start date' });
        }

        const leaveRequest = await LeaveRequest.create({
            personnelId: req.user._id,
            type,
            startDate: start,
            endDate: end,
            reason,
            status: 'Pending'
        });

        const populated = await LeaveRequest.findById(leaveRequest._id)
            .populate('personnelId', 'name email avatar role status');

        return res.status(201).json({ success: true, leaveRequest: populated });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ─── GET /api/leaves ──────────────────────────────────────────────────────────
// Admin: all requests | Personnel: only their own
const getLeaveRequests = async (req, res) => {
    try {
        const query = req.user.role === 'personnel' ? { personnelId: req.user._id } : {};

        const requests = await LeaveRequest.find(query)
            .populate('personnelId', 'name email avatar role status')
            .sort({ createdAt: -1 });

        return res.json({ success: true, requests });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ─── PUT /api/leaves/:id ──────────────────────────────────────────────────────
// Admin: approve/reject | Personnel: cancel their own pending request
const updateLeaveStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const leaveRequest = await LeaveRequest.findById(req.params.id);
        if (!leaveRequest) return res.status(404).json({ success: false, message: 'Leave request not found' });

        if (req.user.role === 'personnel') {
            // Personnel can only cancel their own pending request
            if (leaveRequest.personnelId.toString() !== req.user._id.toString()) {
                return res.status(403).json({ success: false, message: 'Access denied' });
            }
            if (leaveRequest.status !== 'Pending') {
                return res.status(400).json({ success: false, message: 'Only pending requests can be cancelled' });
            }
            if (status !== 'Cancelled') {
                return res.status(400).json({ success: false, message: 'Personnel can only cancel their own requests' });
            }
        }

        leaveRequest.status = status;
        await leaveRequest.save();

        // Admin approves → set user On Leave + deduct balance
        if (status === 'Approved') {
            const user = await User.findById(leaveRequest.personnelId);
            if (user) {
                user.status = 'On Leave';

                const start = new Date(leaveRequest.startDate);
                const end = new Date(leaveRequest.endDate);
                const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

                const typeKey = leaveRequest.type === 'Sick Leave' ? 'sick'
                    : leaveRequest.type === 'Vacation' ? 'vacation' : 'personal';

                if (user.leaveBalances && user.leaveBalances[typeKey] !== undefined) {
                    user.leaveBalances[typeKey] = Math.max(0, user.leaveBalances[typeKey] - days);
                }

                await user.save();
            }
        }

        // Admin rejects → ensure user stays Off Duty (not On Leave)
        if (status === 'Rejected') {
            // No status change needed, user wasn't set to On Leave yet
        }

        const updated = await LeaveRequest.findById(leaveRequest._id)
            .populate('personnelId', 'name email avatar role status');

        return res.json({ success: true, leaveRequest: updated });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { createLeaveRequest, getLeaveRequests, updateLeaveStatus };
