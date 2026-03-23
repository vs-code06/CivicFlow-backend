const Zone = require('../models/Zone');
const Task = require('../models/Task');
const Complaint = require('../models/Complaint');
const User = require('../models/User');

// ─── Helper: compute live metrics for a zone ──────────────────────────────────
const withMetrics = async (zone) => {
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
const getZones = async (req, res) => {
    try {
        const zones = await Zone.find().sort({ name: 1 });
        const result = await Promise.all(zones.map(z => withMetrics(z)));
        return res.json({ success: true, zones: result });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ─── GET /api/zones/my ────────────────────────────────────────────────────────
// Resident: get their assigned zone with live metrics
const getMyZone = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user || !user.zoneId) {
            return res.json({ success: true, zone: null });
        }

        const zone = await Zone.findById(user.zoneId);
        if (!zone) return res.json({ success: true, zone: null });

        const result = await withMetrics(zone);
        return res.json({ success: true, zone: result });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ─── GET /api/zones/:id ───────────────────────────────────────────────────────
const getZoneById = async (req, res) => {
    try {
        const zone = await Zone.findById(req.params.id);
        if (!zone) return res.status(404).json({ success: false, message: 'Zone not found' });
        const result = await withMetrics(zone);
        return res.json({ success: true, zone: result });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ─── POST /api/zones ──────────────────────────────────────────────────────────
// Admin only
const createZone = async (req, res) => {
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
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ─── PUT /api/zones/:id ───────────────────────────────────────────────────────
// Admin only
const updateZone = async (req, res) => {
    try {
        const zone = await Zone.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!zone) return res.status(404).json({ success: false, message: 'Zone not found' });
        const result = await withMetrics(zone);
        return res.json({ success: true, zone: result });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ─── POST /api/zones/:id/areas ────────────────────────────────────────────────
// Admin only
const addAreaToZone = async (req, res) => {
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
            issues: 0
        });

        await zone.save();
        return res.status(201).json({ success: true, zone });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { getZones, getMyZone, getZoneById, createZone, updateZone, addAreaToZone };
