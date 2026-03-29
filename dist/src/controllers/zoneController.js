"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getZoneScheduleStatus = exports.updateZoneSchedule = exports.addAreaToZone = exports.updateZone = exports.createZone = exports.getZoneById = exports.getMyZone = exports.getZones = void 0;
const Zone_1 = __importDefault(require("../models/Zone"));
const Task_1 = __importDefault(require("../models/Task"));
const Complaint_1 = __importDefault(require("../models/Complaint"));
const User_1 = __importDefault(require("../models/User"));
// ─── Helper: compute live metrics for a zone ──────────────────────────────────
const withMetrics = async (zone) => {
    const z = zone.toObject ? zone.toObject() : zone;
    const [activeTasksCount, activeIssuesCount] = await Promise.all([
        Task_1.default.countDocuments({ zoneId: z._id, status: { $in: ['Pending', 'Accepted', 'In Progress'] } }),
        Complaint_1.default.countDocuments({ zoneId: z._id, status: { $ne: 'resolved' } })
    ]);
    let operationalScore = 100 - (activeIssuesCount * 5) - (activeTasksCount * 2);
    operationalScore = Math.max(0, Math.min(100, operationalScore));
    let status = 'Good';
    if (operationalScore < 60)
        status = 'Critical';
    else if (operationalScore < 85)
        status = 'Attention';
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
const getZones = async (req, res) => {
    try {
        const zones = await Zone_1.default.find().sort({ name: 1 });
        const result = await Promise.all(zones.map(z => withMetrics(z)));
        return res.json({ success: true, zones: result });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
exports.getZones = getZones;
// ─── GET /api/zones/my ────────────────────────────────────────────────────────
const getMyZone = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        const user = await User_1.default.findById(req.user._id);
        if (!user || !user.zoneId) {
            return res.json({ success: true, zone: null });
        }
        const zone = await Zone_1.default.findById(user.zoneId);
        if (!zone)
            return res.json({ success: true, zone: null });
        const result = await withMetrics(zone);
        return res.json({ success: true, zone: result });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
exports.getMyZone = getMyZone;
// ─── GET /api/zones/:id ───────────────────────────────────────────────────────
const getZoneById = async (req, res) => {
    try {
        const zone = await Zone_1.default.findById(req.params.id);
        if (!zone)
            return res.status(404).json({ success: false, message: 'Zone not found' });
        const result = await withMetrics(zone);
        return res.json({ success: true, zone: result });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
exports.getZoneById = getZoneById;
// ─── POST /api/zones ──────────────────────────────────────────────────────────
const createZone = async (req, res) => {
    try {
        const { name, manager, coverage } = req.body;
        if (!name)
            return res.status(400).json({ success: false, message: 'Zone name is required' });
        const exists = await Zone_1.default.findOne({ name });
        if (exists)
            return res.status(409).json({ success: false, message: 'Zone already exists' });
        const zone = await Zone_1.default.create({
            name,
            manager: manager || 'Unassigned',
            coverage: coverage || 85,
            healthScore: 100,
            areas: []
        });
        return res.status(201).json({ success: true, zone });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
exports.createZone = createZone;
// ─── PUT /api/zones/:id ───────────────────────────────────────────────────────
const updateZone = async (req, res) => {
    try {
        const zone = await Zone_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!zone)
            return res.status(404).json({ success: false, message: 'Zone not found' });
        const result = await withMetrics(zone);
        return res.json({ success: true, zone: result });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
exports.updateZone = updateZone;
// ─── POST /api/zones/:id/areas ────────────────────────────────────────────────
const addAreaToZone = async (req, res) => {
    try {
        const zone = await Zone_1.default.findById(req.params.id);
        if (!zone)
            return res.status(404).json({ success: false, message: 'Zone not found' });
        const { name, type, status, cleanlinessScore } = req.body;
        if (!name)
            return res.status(400).json({ success: false, message: 'Area name is required' });
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
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
exports.addAreaToZone = addAreaToZone;
// ─── PUT /api/zones/:id/schedule ──────────────────────────────────────────────
const updateZoneSchedule = async (req, res) => {
    try {
        const { schedule } = req.body;
        if (!schedule || !Array.isArray(schedule)) {
            return res.status(400).json({ success: false, message: 'Schedule array is required' });
        }
        const zone = await Zone_1.default.findById(req.params.id);
        if (!zone)
            return res.status(404).json({ success: false, message: 'Zone not found' });
        zone.schedule = schedule;
        await zone.save();
        const result = await withMetrics(zone);
        return res.json({ success: true, zone: result });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
exports.updateZoneSchedule = updateZoneSchedule;
// ─── GET /api/zones/:id/schedule-status ───────────────────────────────────────
const getZoneScheduleStatus = async (req, res) => {
    try {
        const zone = await Zone_1.default.findById(req.params.id);
        if (!zone)
            return res.status(404).json({ success: false, message: 'Zone not found' });
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
        const task = await Task_1.default.findOne({
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
                startedAt = task.startedAt;
            }
            else if (task.status === 'Completed') {
                status = 'completed';
                completedAt = task.completedAt;
            }
            else if (task.status === 'Accepted') {
                status = 'dispatched';
            }
            else {
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
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
exports.getZoneScheduleStatus = getZoneScheduleStatus;
