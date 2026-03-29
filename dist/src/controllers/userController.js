"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLeaveRequests = exports.deleteUser = exports.updateUserRole = exports.updateStatus = exports.getAllUsers = exports.getPersonnel = void 0;
const User_1 = __importDefault(require("../models/User"));
const Vehicle_1 = __importDefault(require("../models/Vehicle"));
const LeaveRequest_1 = __importDefault(require("../models/LeaveRequest"));
// ─── GET /api/users/personnel ─────────────────────────────────────────────────
const getPersonnel = async (req, res) => {
    try {
        const { status, search } = req.query;
        const query = { role: 'personnel' };
        if (status && status !== 'All')
            query.status = status;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        const personnel = await User_1.default.find(query)
            .select('-password')
            .sort({ name: 1 });
        const vehicleIds = [...new Set(personnel.filter(p => p.assignedVehicle).map(p => p.assignedVehicle))];
        const vehicles = await Vehicle_1.default.find({ vehicleId: { $in: vehicleIds } });
        const vehicleMap = {};
        vehicles.forEach(v => { vehicleMap[v.vehicleId] = v; });
        const result = personnel.map(p => ({
            ...p.toObject(),
            vehicleDetails: p.assignedVehicle ? vehicleMap[p.assignedVehicle] || null : null
        }));
        return res.json({ success: true, personnel: result });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
exports.getPersonnel = getPersonnel;
// ─── GET /api/users ───────────────────────────────────────────────────────────
const getAllUsers = async (req, res) => {
    try {
        const { role, status, search, page = 1, limit = 20 } = req.query;
        const query = {};
        if (role && role !== 'All')
            query.role = role;
        if (status && status !== 'All')
            query.status = status;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await User_1.default.countDocuments(query);
        const users = await User_1.default.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));
        return res.json({
            success: true,
            users,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit))
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
exports.getAllUsers = getAllUsers;
// ─── PUT /api/users/status ────────────────────────────────────────────────────
const updateStatus = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const { status } = req.body;
        const allowed = ['On Duty', 'Off Duty'];
        if (!allowed.includes(status)) {
            return res.status(400).json({ success: false, message: 'Status must be On Duty or Off Duty' });
        }
        const user = await User_1.default.findById(req.user._id);
        if (!user)
            return res.status(404).json({ success: false, message: 'User not found' });
        if (user.status === 'On Leave') {
            return res.status(400).json({ success: false, message: 'Cannot change status while on leave' });
        }
        const updated = await User_1.default.findByIdAndUpdate(req.user._id, { status }, { new: true }).select('-password');
        return res.json({ success: true, user: updated });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
exports.updateStatus = updateStatus;
// ─── PUT /api/users/:id/role ──────────────────────────────────────────────────
const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        const allowed = ['admin', 'personnel', 'resident'];
        if (!allowed.includes(role)) {
            return res.status(400).json({ success: false, message: 'Invalid role' });
        }
        const user = await User_1.default.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
        if (!user)
            return res.status(404).json({ success: false, message: 'User not found' });
        return res.json({ success: true, user });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
exports.updateUserRole = updateUserRole;
// ─── DELETE /api/users/:id ────────────────────────────────────────────────────
const deleteUser = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        if (req.params.id === req.user._id.toString()) {
            return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
        }
        const user = await User_1.default.findByIdAndDelete(req.params.id);
        if (!user)
            return res.status(404).json({ success: false, message: 'User not found' });
        return res.json({ success: true, message: 'User deleted' });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
exports.deleteUser = deleteUser;
// ─── GET /api/users/leave-requests ───────────────────────────────────────────
const getLeaveRequests = async (req, res) => {
    try {
        const requests = await LeaveRequest_1.default.find()
            .populate('personnelId', 'name email avatar role status')
            .sort({ createdAt: -1 });
        return res.json({ success: true, requests });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
exports.getLeaveRequests = getLeaveRequests;
