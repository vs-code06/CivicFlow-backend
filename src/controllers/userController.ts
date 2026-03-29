import { Request, Response } from 'express';
import User, { IUser } from '../models/User';
import Vehicle, { IVehicle } from '../models/Vehicle';
import LeaveRequest from '../models/LeaveRequest';
import { AuthRequest } from '../middleware/authMiddleware';

// ─── GET /api/users/personnel ─────────────────────────────────────────────────
export const getPersonnel = async (req: Request, res: Response) => {
    try {
        const { status, search } = req.query;
        const query: any = { role: 'personnel' };

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

        const vehicleIds = [...new Set(personnel.filter(p => p.assignedVehicle).map(p => p.assignedVehicle))];
        const vehicles = await Vehicle.find({ vehicleId: { $in: vehicleIds as string[] } });
        
        const vehicleMap: { [key: string]: IVehicle } = {};
        vehicles.forEach(v => { vehicleMap[v.vehicleId] = v; });

        const result = personnel.map(p => ({
            ...p.toObject(),
            vehicleDetails: p.assignedVehicle ? vehicleMap[p.assignedVehicle] || null : null
        }));

        return res.json({ success: true, personnel: result });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ─── GET /api/users ───────────────────────────────────────────────────────────
export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const { role, status, search, page = 1, limit = 20 } = req.query;
        const query: any = {};

        if (role && role !== 'All') query.role = role;
        if (status && status !== 'All') query.status = status;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
        const total = await User.countDocuments(query);
        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit as string));

        return res.json({ 
            success: true, 
            users, 
            total, 
            page: parseInt(page as string), 
            pages: Math.ceil(total / parseInt(limit as string)) 
        });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ─── PUT /api/users/status ────────────────────────────────────────────────────
export const updateStatus = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });

        const { status } = req.body;
        const allowed = ['On Duty', 'Off Duty'];
        if (!allowed.includes(status)) {
            return res.status(400).json({ success: false, message: 'Status must be On Duty or Off Duty' });
        }

        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        
        if (user.status === 'On Leave') {
            return res.status(400).json({ success: false, message: 'Cannot change status while on leave' });
        }

        const updated = await User.findByIdAndUpdate(req.user._id, { status }, { new: true }).select('-password');
        return res.json({ success: true, user: updated });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ─── PUT /api/users/:id/role ──────────────────────────────────────────────────
export const updateUserRole = async (req: Request, res: Response) => {
    try {
        const { role } = req.body;
        const allowed = ['admin', 'personnel', 'resident'];
        if (!allowed.includes(role)) {
            return res.status(400).json({ success: false, message: 'Invalid role' });
        }

        const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        return res.json({ success: true, user });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ─── DELETE /api/users/:id ────────────────────────────────────────────────────
export const deleteUser = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });

        if (req.params.id === req.user._id.toString()) {
            return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
        }

        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        return res.json({ success: true, message: 'User deleted' });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ─── GET /api/users/leave-requests ───────────────────────────────────────────
export const getLeaveRequests = async (req: Request, res: Response) => {
    try {
        const requests = await LeaveRequest.find()
            .populate('personnelId', 'name email avatar role status')
            .sort({ createdAt: -1 });
        return res.json({ success: true, requests });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
