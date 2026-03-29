"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOperationalMetrics = exports.getZonePerformance = exports.getWasteComposition = exports.getCollectionTrends = void 0;
const Task_1 = __importDefault(require("../models/Task"));
const Zone_1 = __importDefault(require("../models/Zone"));
const Complaint_1 = __importDefault(require("../models/Complaint"));
const date_fns_1 = require("date-fns");
// ─── GET /api/analytics/trends ───────────────────────────────────────────────
const getCollectionTrends = async (req, res) => {
    try {
        const thirtyDaysAgo = (0, date_fns_1.subDays)(new Date(), 30);
        const trends = await Task_1.default.aggregate([
            {
                $match: {
                    status: 'Completed',
                    completedAt: { $gte: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$completedAt" } },
                    count: { $sum: 1 },
                    avgCompletionTime: {
                        $avg: { $subtract: ["$completedAt", "$startedAt"] }
                    }
                }
            },
            { $sort: { "_id": 1 } }
        ]);
        return res.json({ success: true, data: trends });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
exports.getCollectionTrends = getCollectionTrends;
// ─── GET /api/analytics/composition ──────────────────────────────────────────
const getWasteComposition = async (req, res) => {
    try {
        const composition = await Task_1.default.aggregate([
            { $match: { status: 'Completed' } },
            {
                $group: {
                    _id: "$type",
                    value: { $sum: 1 }
                }
            }
        ]);
        return res.json({ success: true, data: composition });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
exports.getWasteComposition = getWasteComposition;
// ─── GET /api/analytics/zone-performance ──────────────────────────────────────
const getZonePerformance = async (req, res) => {
    try {
        const zones = await Zone_1.default.find({}, 'name healthScore status');
        const performance = await Promise.all(zones.map(async (zone) => {
            const completedInZone = await Task_1.default.countDocuments({
                zoneId: zone._id,
                status: 'Completed'
            });
            const issuesInZone = await Task_1.default.countDocuments({
                zoneId: zone._id,
                status: 'Issue Reported'
            });
            return {
                _id: zone._id,
                name: zone.name,
                healthScore: zone.healthScore,
                status: zone.status,
                completedTasks: completedInZone,
                reportedIssues: issuesInZone,
                efficiency: completedInZone > 0
                    ? Math.round((completedInZone / (completedInZone + issuesInZone)) * 100)
                    : 100
            };
        }));
        return res.json({ success: true, data: performance.sort((a, b) => b.efficiency - a.efficiency) });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
exports.getZonePerformance = getZonePerformance;
// ─── GET /api/analytics/metrics ───────────────────────────────────────────────
const getOperationalMetrics = async (req, res) => {
    try {
        const totalCompleted = await Task_1.default.countDocuments({ status: 'Completed' });
        const avgEfficiency = await Zone_1.default.aggregate([{ $group: { _id: null, avg: { $avg: "$healthScore" } } }]);
        const totalComplaints = await Complaint_1.default.countDocuments();
        const pendingComplaints = await Complaint_1.default.countDocuments({ status: 'pending' });
        return res.json({
            success: true,
            data: {
                totalWasteItems: totalCompleted,
                avgHealth: avgEfficiency[0]?.avg || 0,
                complaintResolution: totalComplaints > 0
                    ? Math.round(((totalComplaints - pendingComplaints) / totalComplaints) * 100)
                    : 100
            }
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
exports.getOperationalMetrics = getOperationalMetrics;
