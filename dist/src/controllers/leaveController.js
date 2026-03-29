"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateLeaveStatus = exports.getLeaveRequests = exports.createLeaveRequest = void 0;
const LeaveRequest_1 = __importDefault(require("../models/LeaveRequest"));
const User_1 = __importDefault(require("../models/User"));
// ─── POST /api/leaves ─────────────────────────────────────────────────────────
const createLeaveRequest = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const { type, startDate, endDate, reason } = req.body;
        if (!type || !startDate || !endDate || !reason) {
            return res.status(400).json({ success: false, message: 'Type, start date, end date, and reason are required' });
        }
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (end < start) {
            return res.status(400).json({ success: false, message: 'End date must be after start date' });
        }
        const leaveRequest = await LeaveRequest_1.default.create({
            personnelId: req.user._id,
            type,
            startDate: start,
            endDate: end,
            reason,
            status: 'Pending'
        });
        const populated = await LeaveRequest_1.default.findById(leaveRequest._id)
            .populate('personnelId', 'name email avatar role status');
        return res.status(201).json({ success: true, leaveRequest: populated });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
exports.createLeaveRequest = createLeaveRequest;
// ─── GET /api/leaves ──────────────────────────────────────────────────────────
const getLeaveRequests = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const query = req.user.role === 'personnel' ? { personnelId: req.user._id } : {};
        const requests = await LeaveRequest_1.default.find(query)
            .populate('personnelId', 'name email avatar role status')
            .sort({ createdAt: -1 });
        return res.json({ success: true, requests });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
exports.getLeaveRequests = getLeaveRequests;
// ─── PUT /api/leaves/:id ──────────────────────────────────────────────────────
const updateLeaveStatus = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const { status } = req.body;
        const leaveRequest = await LeaveRequest_1.default.findById(req.params.id);
        if (!leaveRequest)
            return res.status(404).json({ success: false, message: 'Leave request not found' });
        if (req.user.role === 'personnel') {
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
        if (status === 'Approved') {
            const user = await User_1.default.findById(leaveRequest.personnelId);
            if (user) {
                user.status = 'On Leave';
                const start = new Date(leaveRequest.startDate).getTime();
                const end = new Date(leaveRequest.endDate).getTime();
                const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
                const typeKey = (leaveRequest.type === 'Sick' ? 'sick'
                    : leaveRequest.type === 'Vacation' ? 'vacation' : 'personal');
                if (user.leaveBalances && user.leaveBalances[typeKey] !== undefined) {
                    user.leaveBalances[typeKey] = Math.max(0, user.leaveBalances[typeKey] - days);
                }
                await user.save();
            }
        }
        const updated = await LeaveRequest_1.default.findById(leaveRequest._id)
            .populate('personnelId', 'name email avatar role status');
        return res.json({ success: true, leaveRequest: updated });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
exports.updateLeaveStatus = updateLeaveStatus;
