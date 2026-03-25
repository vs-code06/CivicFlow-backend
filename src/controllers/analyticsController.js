const Task = require('../models/Task');
const Zone = require('../models/Zone');
const Complaint = require('../models/Complaint');
const { startOfDay, subDays } = require('date-fns');

// ─── GET /api/analytics/trends ───────────────────────────────────────────────
// Returns daily collection volume (completed tasks) for the last 30 days
exports.getCollectionTrends = async (req, res) => {
    try {
        const thirtyDaysAgo = subDays(new Date(), 30);
        
        const trends = await Task.aggregate([
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
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ─── GET /api/analytics/composition ──────────────────────────────────────────
// Returns waste type distribution based on task types
exports.getWasteComposition = async (req, res) => {
    try {
        const composition = await Task.aggregate([
            { $match: { status: 'Completed' } },
            {
                $group: {
                    _id: "$type",
                    value: { $sum: 1 }
                }
            }
        ]);

        return res.json({ success: true, data: composition });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ─── GET /api/analytics/zone-performance ──────────────────────────────────────
// Returns all zones with their health scores and efficiency metrics
exports.getZonePerformance = async (req, res) => {
    try {
        const zones = await Zone.find({}, 'name healthScore status');
        
        // Add completion counts per zone
        const performance = await Promise.all(zones.map(async (zone) => {
            const completedInZone = await Task.countDocuments({ 
                zoneId: zone._id, 
                status: 'Completed' 
            });
            const issuesInZone = await Task.countDocuments({ 
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
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ─── GET /api/analytics/metrics ───────────────────────────────────────────────
// Returns high-level operational metrics
exports.getOperationalMetrics = async (req, res) => {
    try {
        const totalCompleted = await Task.countDocuments({ status: 'Completed' });
        const avgEfficiency = await Zone.aggregate([{ $group: { _id: null, avg: { $avg: "$healthScore" } } }]);
        const totalComplaints = await Complaint.countDocuments();
        const pendingComplaints = await Complaint.countDocuments({ status: 'pending' });

        return res.json({
            success: true,
            data: {
                totalWasteItems: totalCompleted, // Mock total t calculation
                avgHealth: avgEfficiency[0]?.avg || 0,
                complaintResolution: totalComplaints > 0 
                    ? Math.round(((totalComplaints - pendingComplaints) / totalComplaints) * 100) 
                    : 100
            }
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
