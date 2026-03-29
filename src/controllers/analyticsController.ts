import { Request, Response } from 'express';
import Task from '../models/Task';
import Zone from '../models/Zone';
import Complaint from '../models/Complaint';
import { subDays } from 'date-fns';

// ─── GET /api/analytics/trends ───────────────────────────────────────────────
export const getCollectionTrends = async (req: Request, res: Response) => {
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
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ─── GET /api/analytics/composition ──────────────────────────────────────────
export const getWasteComposition = async (req: Request, res: Response) => {
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
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ─── GET /api/analytics/zone-performance ──────────────────────────────────────
export const getZonePerformance = async (req: Request, res: Response) => {
    try {
        const zones = await Zone.find({}, 'name healthScore status');
        
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
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ─── GET /api/analytics/metrics ───────────────────────────────────────────────
export const getOperationalMetrics = async (req: Request, res: Response) => {
    try {
        const totalCompleted = await Task.countDocuments({ status: 'Completed' });
        const avgEfficiency = await Zone.aggregate([{ $group: { _id: null, avg: { $avg: "$healthScore" } } }]);
        const totalComplaints = await Complaint.countDocuments();
        const pendingComplaints = await Complaint.countDocuments({ status: 'pending' });

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
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
