const User = require('../models/User');
const Vehicle = require('../models/Vehicle');

// ─── GET /api/users/personnel ─────────────────────────────────────────────────
// Admin: get all personnel with their assigned vehicle populated
const getPersonnel = async (req, res) => {
    try {
        const { status, search } = req.query;
        const query = { role: 'personnel' };

        if (status && status !== 'All') query.status = status;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const personnel = await User.find(query)
            .select('-password')
            .sort({ name: 1 });

        // Populate assignedVehicle from Vehicle collection
        const Vehicle = require('../models/Vehicle');
        const vehicleIds = [...new Set(personnel.filter(p => p.assignedVehicle).map(p => p.assignedVehicle))];
        const vehicles = await Vehicle.find({ vehicleId: { $in: vehicleIds } });
        const vehicleMap = {};
        vehicles.forEach(v => { vehicleMap[v.vehicleId] = v; });

        const result = personnel.map(p => ({
            ...p.toObject(),
            vehicleDetails: p.assignedVehicle ? vehicleMap[p.assignedVehicle] || null : null
        }));

        return res.json({ success: true, personnel: result });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ─── GET /api/users ───────────────────────────────────────────────────────────
// Admin: get all users with role/status filters
const getAllUsers = async (req, res) => {
    try {
        const { role, status, search, page = 1, limit = 20 } = req.query;
        const query = {};

        if (role && role !== 'All') query.role = role;
        if (status && status !== 'All') query.status = status;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await User.countDocuments(query);
        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        return res.json({ success: true, users, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ─── PUT /api/users/status ────────────────────────────────────────────────────
// Personnel: toggle their own duty status
const updateStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const allowed = ['On Duty', 'Off Duty'];
        if (!allowed.includes(status)) {
            return res.status(400).json({ success: false, message: 'Status must be On Duty or Off Duty' });
        }

        // Cannot toggle if On Leave
        const user = await User.findById(req.user._id);
        if (user.status === 'On Leave') {
            return res.status(400).json({ success: false, message: 'Cannot change status while on leave' });
        }

        const updated = await User.findByIdAndUpdate(req.user._id, { status }, { new: true }).select('-password');
        return res.json({ success: true, user: updated });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ─── PUT /api/users/:id/role ──────────────────────────────────────────────────
// Admin: change a user's role
const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        const allowed = ['admin', 'personnel', 'resident'];
        if (!allowed.includes(role)) {
            return res.status(400).json({ success: false, message: 'Invalid role' });
        }

        const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        return res.json({ success: true, user });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ─── DELETE /api/users/:id ────────────────────────────────────────────────────
// Admin: delete a user
const deleteUser = async (req, res) => {
    try {
        if (req.params.id === req.user._id.toString()) {
            return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
        }

        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        return res.json({ success: true, message: 'User deleted' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ─── GET /api/users/leave-requests ───────────────────────────────────────────
// Admin: get all leave requests with personnel info
const getLeaveRequests = async (req, res) => {
    try {
        const LeaveRequest = require('../models/LeaveRequest');
        const requests = await LeaveRequest.find()
            .populate('personnelId', 'name email avatar role status')
            .sort({ createdAt: -1 });
        return res.json({ success: true, requests });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { getPersonnel, getAllUsers, updateStatus, updateUserRole, deleteUser, getLeaveRequests };
