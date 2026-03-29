import { Response } from 'express';
import Complaint from '../models/Complaint';
import ActivityLog from '../models/ActivityLog';
import { AuthRequest } from '../middleware/authMiddleware';

// ─── GET /api/complaints ──────────────────────────────────────────────────────
export const getComplaints = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });

        const { status, priority, search, startDate, endDate, page = 1, limit = 10 } = req.query;
        const query: any = {};

        // Residents only see their own
        if (req.user.role === 'resident') query.residentId = req.user._id;

        if (status && status !== 'All') query.status = (status as string).toLowerCase();
        if (priority && priority !== 'All') query.priority = (priority as string).toLowerCase();

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate as string);
            if (endDate) {
                const end = new Date(endDate as string);
                end.setHours(23, 59, 59, 999);
                query.createdAt.$lte = end;
            }
        }

        if (search) {
            query.$or = [
                { type: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { location: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
        const total = await Complaint.countDocuments(query);
        const complaints = await Complaint.find(query)
            .populate('residentId', 'name email phone avatar')
            .populate('assignedTo', 'name email')
            .populate('zoneId', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit as string));

        return res.json({ success: true, complaints, total, page: parseInt(page as string), pages: Math.ceil(total / parseInt(limit as string)) });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ─── GET /api/complaints/stats ────────────────────────────────────────────────
export const getComplaintStats = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });

        const match = req.user.role === 'resident' ? { residentId: req.user._id } : {};

        const stats = await Complaint.aggregate([
            { $match: match },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const result = { total: 0, pending: 0, inProgress: 0, resolved: 0 };
        stats.forEach(s => {
            result.total += s.count;
            if (s._id === 'pending') result.pending = s.count;
            if (s._id === 'in-progress') result.inProgress = s.count;
            if (s._id === 'resolved') result.resolved = s.count;
        });

        return res.json({ success: true, stats: result });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ─── GET /api/complaints/:id ──────────────────────────────────────────────────
export const getComplaintById = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });

        const complaint = await Complaint.findById(req.params.id)
            .populate('residentId', 'name email phone avatar')
            .populate('assignedTo', 'name email')
            .populate('zoneId', 'name');

        if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });

        const residentId = (complaint.residentId as any)?._id || complaint.residentId;
        // Residents can only view their own
        if (req.user.role === 'resident' && residentId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        return res.json({ success: true, complaint });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ─── POST /api/complaints ─────────────────────────────────────────────────────
export const createComplaint = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });

        const { type, description, location, imageUrl, zoneId, priority } = req.body;
        if (!type || !description) {
            return res.status(400).json({ success: false, message: 'Type and description are required' });
        }

        const complaint = await Complaint.create({
            residentId: req.user._id,
            type,
            description,
            location: location || '',
            imageUrl: imageUrl || '',
            zoneId: zoneId || null,
            priority: priority || 'medium',
            status: 'pending',
            updates: [{ message: 'Complaint received and is being reviewed', active: true, date: new Date() }]
        });

        await ActivityLog.create({
            action: 'Complaint Filed',
            user: req.user._id,
            details: `${type} reported at ${location || 'unknown location'}`,
            type: 'Warning'
        });

        return res.status(201).json({ success: true, complaint });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ─── PUT /api/complaints/:id ──────────────────────────────────────────────────
export const updateComplaint = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });

        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });

        const { status, priority, assignedTo, newUpdate } = req.body;

        if (status) complaint.status = status;
        if (priority) complaint.priority = priority;
        if (assignedTo !== undefined) (complaint as any).assignedTo = assignedTo || null;

        if (newUpdate) {
            complaint.updates.forEach(u => { u.active = false; });
            complaint.updates.push({ message: newUpdate, active: true, date: new Date() });
        }

        await complaint.save();

        if (status === 'resolved') {
            await ActivityLog.create({
                action: 'Complaint Resolved',
                user: req.user._id,
                details: `Complaint at ${complaint.location} resolved`,
                type: 'Success'
            });
        }

        const updated = await Complaint.findById(complaint._id)
            .populate('residentId', 'name email phone avatar')
            .populate('assignedTo', 'name email')
            .populate('zoneId', 'name');

        return res.json({ success: true, complaint: updated });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ─── DELETE /api/complaints/:id ───────────────────────────────────────────────
export const deleteComplaint = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });

        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });

        if (complaint.residentId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'You can only delete your own complaints' });
        }

        if (complaint.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Only pending complaints can be cancelled' });
        }

        await complaint.deleteOne();
        return res.json({ success: true, message: 'Complaint cancelled' });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
