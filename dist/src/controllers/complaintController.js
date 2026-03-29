"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteComplaint = exports.updateComplaint = exports.createComplaint = exports.getComplaintById = exports.getComplaintStats = exports.getComplaints = void 0;
const Complaint_1 = __importDefault(require("../models/Complaint"));
const ActivityLog_1 = __importDefault(require("../models/ActivityLog"));
// ─── GET /api/complaints ──────────────────────────────────────────────────────
const getComplaints = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const { status, priority, search, startDate, endDate, page = 1, limit = 10 } = req.query;
        const query = {};
        // Residents only see their own
        if (req.user.role === 'resident')
            query.residentId = req.user._id;
        if (status && status !== 'All')
            query.status = status.toLowerCase();
        if (priority && priority !== 'All')
            query.priority = priority.toLowerCase();
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate)
                query.createdAt.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
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
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await Complaint_1.default.countDocuments(query);
        const complaints = await Complaint_1.default.find(query)
            .populate('residentId', 'name email phone avatar')
            .populate('assignedTo', 'name email')
            .populate('zoneId', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));
        return res.json({ success: true, complaints, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
exports.getComplaints = getComplaints;
// ─── GET /api/complaints/stats ────────────────────────────────────────────────
const getComplaintStats = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const match = req.user.role === 'resident' ? { residentId: req.user._id } : {};
        const stats = await Complaint_1.default.aggregate([
            { $match: match },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        const result = { total: 0, pending: 0, inProgress: 0, resolved: 0 };
        stats.forEach(s => {
            result.total += s.count;
            if (s._id === 'pending')
                result.pending = s.count;
            if (s._id === 'in-progress')
                result.inProgress = s.count;
            if (s._id === 'resolved')
                result.resolved = s.count;
        });
        return res.json({ success: true, stats: result });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
exports.getComplaintStats = getComplaintStats;
// ─── GET /api/complaints/:id ──────────────────────────────────────────────────
const getComplaintById = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const complaint = await Complaint_1.default.findById(req.params.id)
            .populate('residentId', 'name email phone avatar')
            .populate('assignedTo', 'name email')
            .populate('zoneId', 'name');
        if (!complaint)
            return res.status(404).json({ success: false, message: 'Complaint not found' });
        const residentId = complaint.residentId?._id || complaint.residentId;
        // Residents can only view their own
        if (req.user.role === 'resident' && residentId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
        return res.json({ success: true, complaint });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
exports.getComplaintById = getComplaintById;
// ─── POST /api/complaints ─────────────────────────────────────────────────────
const createComplaint = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const { type, description, location, imageUrl, zoneId, priority } = req.body;
        if (!type || !description) {
            return res.status(400).json({ success: false, message: 'Type and description are required' });
        }
        const complaint = await Complaint_1.default.create({
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
        await ActivityLog_1.default.create({
            action: 'Complaint Filed',
            user: req.user._id,
            details: `${type} reported at ${location || 'unknown location'}`,
            type: 'Warning'
        });
        return res.status(201).json({ success: true, complaint });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
exports.createComplaint = createComplaint;
// ─── PUT /api/complaints/:id ──────────────────────────────────────────────────
const updateComplaint = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const complaint = await Complaint_1.default.findById(req.params.id);
        if (!complaint)
            return res.status(404).json({ success: false, message: 'Complaint not found' });
        const { status, priority, assignedTo, newUpdate } = req.body;
        if (status)
            complaint.status = status;
        if (priority)
            complaint.priority = priority;
        if (assignedTo !== undefined)
            complaint.assignedTo = assignedTo || null;
        if (newUpdate) {
            complaint.updates.forEach(u => { u.active = false; });
            complaint.updates.push({ message: newUpdate, active: true, date: new Date() });
        }
        await complaint.save();
        if (status === 'resolved') {
            await ActivityLog_1.default.create({
                action: 'Complaint Resolved',
                user: req.user._id,
                details: `Complaint at ${complaint.location} resolved`,
                type: 'Success'
            });
        }
        const updated = await Complaint_1.default.findById(complaint._id)
            .populate('residentId', 'name email phone avatar')
            .populate('assignedTo', 'name email')
            .populate('zoneId', 'name');
        return res.json({ success: true, complaint: updated });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
exports.updateComplaint = updateComplaint;
// ─── DELETE /api/complaints/:id ───────────────────────────────────────────────
const deleteComplaint = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const complaint = await Complaint_1.default.findById(req.params.id);
        if (!complaint)
            return res.status(404).json({ success: false, message: 'Complaint not found' });
        if (complaint.residentId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'You can only delete your own complaints' });
        }
        if (complaint.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Only pending complaints can be cancelled' });
        }
        await complaint.deleteOne();
        return res.json({ success: true, message: 'Complaint cancelled' });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
exports.deleteComplaint = deleteComplaint;
