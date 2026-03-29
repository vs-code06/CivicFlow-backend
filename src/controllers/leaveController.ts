import { Response } from 'express';
import LeaveRequest from '../models/LeaveRequest';
import User, { IUser } from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';

// ─── POST /api/leaves ─────────────────────────────────────────────────────────
export const createLeaveRequest = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });

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
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ─── GET /api/leaves ──────────────────────────────────────────────────────────
export const getLeaveRequests = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });

        const query = req.user.role === 'personnel' ? { personnelId: req.user._id } : {};

        const requests = await LeaveRequest.find(query)
            .populate('personnelId', 'name email avatar role status')
            .sort({ createdAt: -1 });

        return res.json({ success: true, requests });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ─── PUT /api/leaves/:id ──────────────────────────────────────────────────────
export const updateLeaveStatus = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });

        const { status } = req.body;
        const leaveRequest = await LeaveRequest.findById(req.params.id);
        if (!leaveRequest) return res.status(404).json({ success: false, message: 'Leave request not found' });

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
            const user = await User.findById(leaveRequest.personnelId);
            if (user) {
                user.status = 'On Leave';

                const start = new Date(leaveRequest.startDate).getTime();
                const end = new Date(leaveRequest.endDate).getTime();
                const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

                const typeKey = (leaveRequest.type === 'Sick' ? 'sick'
                    : leaveRequest.type === 'Vacation' ? 'vacation' : 'personal') as keyof IUser['leaveBalances'];

                if (user.leaveBalances && (user.leaveBalances as any)[typeKey] !== undefined) {
                    (user.leaveBalances as any)[typeKey] = Math.max(0, (user.leaveBalances as any)[typeKey] - days);
                }

                await user.save();
            }
        }

        const updated = await LeaveRequest.findById(leaveRequest._id)
            .populate('personnelId', 'name email avatar role status');

        return res.json({ success: true, leaveRequest: updated });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
