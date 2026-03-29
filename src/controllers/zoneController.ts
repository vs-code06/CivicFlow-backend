import { Request, Response } from 'express';
import Zone from '../models/Zone';
import Task from '../models/Task';
import Complaint from '../models/Complaint';
import User from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';

// ─── Helper: compute live metrics for a zone ──────────────────────────────────
const withMetrics = async (zone: any) => {
    const z = zone.toObject ? zone.toObject() : zone;

    const [activeTasksCount, activeIssuesCount] = await Promise.all([
        Task.countDocuments({ zoneId: z._id, status: { $in: ['Pending', 'Accepted', 'In Progress'] } }),
        Complaint.countDocuments({ zoneId: z._id, status: { $ne: 'resolved' } })
    ]);

    let operationalScore = 100 - (activeIssuesCount * 5) - (activeTasksCount * 2);
    operationalScore = Math.max(0, Math.min(100, operationalScore));

    let status = 'Good';
    if (operationalScore < 60) status = 'Critical';
    else if (operationalScore < 85) status = 'Attention';

    return {
        ...z,
        status,
        operationalScore,
        healthScore: z.healthScore !== undefined ? z.healthScore : 100,
        issues: activeIssuesCount,
        tasks: activeTasksCount,
        currentMetrics: z.currentMetrics || { totalCollections: 0, perfectCollections: 0, contaminatedCollections: 0, blockedCollections: 0, missedCollections: 0 },
        coverage: z.coverage || 85
    };
};

// ─── GET /api/zones ───────────────────────────────────────────────────────────
export const getZones = async (req: Request, res: Response) => {
    try {
        const zones = await Zone.find().sort({ name: 1 });
        const result = await Promise.all(zones.map(z => withMetrics(z)));
        return res.json({ success: true, zones: result });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ─── GET /api/zones/my ────────────────────────────────────────────────────────
export const getMyZone = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });

        const user = await User.findById(req.user._id);
        if (!user || !user.zoneId) {
            return res.json({ success: true, zone: null });
        }

        const zone = await Zone.findById(user.zoneId);
        if (!zone) return res.json({ success: true, zone: null });

        const result = await withMetrics(zone);
        return res.json({ success: true, zone: result });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ─── GET /api/zones/:id ───────────────────────────────────────────────────────
export const getZoneById = async (req: Request, res: Response) => {
    try {
        const zone = await Zone.findById(req.params.id);
        if (!zone) return res.status(404).json({ success: false, message: 'Zone not found' });
        const result = await withMetrics(zone);
        return res.json({ success: true, zone: result });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ─── POST /api/zones ──────────────────────────────────────────────────────────
export const createZone = async (req: Request, res: Response) => {
    try {
        const { name, manager, coverage } = req.body;
        if (!name) return res.status(400).json({ success: false, message: 'Zone name is required' });

        const exists = await Zone.findOne({ name });
        if (exists) return res.status(409).json({ success: false, message: 'Zone already exists' });

        const zone = await Zone.create({
            name,
            manager: manager || 'Unassigned',
            coverage: coverage || 85,
            healthScore: 100,
            areas: []
        });

        return res.status(201).json({ success: true, zone });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ─── PUT /api/zones/:id ───────────────────────────────────────────────────────
export const updateZone = async (req: Request, res: Response) => {
    try {
        const zone = await Zone.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!zone) return res.status(404).json({ success: false, message: 'Zone not found' });
        const result = await withMetrics(zone);
        return res.json({ success: true, zone: result });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ─── POST /api/zones/:id/areas ────────────────────────────────────────────────
export const addAreaToZone = async (req: Request, res: Response) => {
    try {
        const zone = await Zone.findById(req.params.id);
        if (!zone) return res.status(404).json({ success: false, message: 'Zone not found' });

        const { name, type, status, cleanlinessScore } = req.body;
        if (!name) return res.status(400).json({ success: false, message: 'Area name is required' });

        zone.areas.push({
            name,
            type: type || ['general'],
            status: status || 'good',
            cleanlinessScore: cleanlinessScore || 100,
            lastVisit: new Date().toISOString(),
            nextPickup: 'TBD',
            issues: 0,
            coordinates: req.body.coordinates || { lat: 0, lng: 0 }
        });

        await zone.save();
        return res.status(201).json({ success: true, zone });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ─── PUT /api/zones/:id/schedule ──────────────────────────────────────────────
export const updateZoneSchedule = async (req: Request, res: Response) => {
    try {
        const { schedule } = req.body;
        if (!schedule || !Array.isArray(schedule)) {
            return res.status(400).json({ success: false, message: 'Schedule array is required' });
        }

        const zone = await Zone.findById(req.params.id);
        if (!zone) return res.status(404).json({ success: false, message: 'Zone not found' });

        zone.schedule = schedule;
        await zone.save();

        const result = await withMetrics(zone);
        return res.json({ success: true, zone: result });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ─── GET /api/zones/:id/schedule-status ───────────────────────────────────────
export const getZoneScheduleStatus = async (req: Request, res: Response) => {
    try {
        const zone = await Zone.findById(req.params.id);
        if (!zone) return res.status(404).json({ success: false, message: 'Zone not found' });

        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const today = new Date();
        const todayName = days[today.getDay()];

        const scheduleEntry = zone.schedule?.find(s => s.day === todayName);

        if (!scheduleEntry) {
            return res.json({
                success: true,
                todayScheduled: false,
                status: 'no-pickup',
                types: [],
                driver: null,
                vehicle: null,
                eta: null
            });
        }

        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);

        const task = await Task.findOne({
            zoneId: zone._id,
            createdAt: { $gte: startOfDay, $lte: endOfDay },
            status: { $in: ['Pending', 'Accepted', 'In Progress', 'Completed'] }
        })
            .populate('assignedTo', 'name avatar phone')
            .populate('vehicleId', 'vehicleId type licensePlate')
            .sort({ updatedAt: -1 });

        let status = 'scheduled';
        let driver = null;
        let vehicle = null;
        let eta = scheduleEntry.startTime;
        let startedAt = null;
        let completedAt = null;

        if (task) {
            driver = task.assignedTo;
            vehicle = task.vehicleId;

            if (task.status === 'In Progress') {
                status = 'driver-en-route';
                startedAt = (task as any).startedAt;
            } else if (task.status === 'Completed') {
                status = 'completed';
                completedAt = (task as any).completedAt;
            } else if (task.status === 'Accepted') {
                status = 'dispatched';
            } else {
                status = 'scheduled';
            }
        }

        const [endH, endM] = (scheduleEntry.endTime || '16:00').split(':').map(Number);
        const endTimeToday = new Date(today);
        endTimeToday.setHours(endH, endM, 0, 0);
        if (today > endTimeToday && status !== 'completed') {
            status = 'delayed';
        }

        return res.json({
            success: true,
            todayScheduled: true,
            status,
            types: scheduleEntry.types,
            scheduledTime: `${scheduleEntry.startTime} - ${scheduleEntry.endTime}`,
            driver,
            vehicle,
            eta,
            startedAt,
            completedAt
        });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
