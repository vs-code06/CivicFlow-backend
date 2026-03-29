import { Request, Response } from 'express';
import Vehicle from '../models/Vehicle';
import Task from '../models/Task';
import Zone from '../models/Zone';
import User from '../models/User';
import Complaint from '../models/Complaint';
import ActivityLog from '../models/ActivityLog';

// ─── GET /api/dashboard/stats ─────────────────────────────────────────────────
export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        // 1. Vehicle stats
        const [totalVehicles, activeVehicles, maintenanceVehicles] = await Promise.all([
            Vehicle.countDocuments(),
            Vehicle.countDocuments({ status: 'Active' }),
            Vehicle.countDocuments({ status: 'Maintenance' })
        ]);

        // 2. Task stats
        const [totalTasks, pendingTasks, acceptedTasks, inProgressTasks, completedTasks, issueTasks] = await Promise.all([
            Task.countDocuments(),
            Task.countDocuments({ status: 'Pending' }),
            Task.countDocuments({ status: 'Accepted' }),
            Task.countDocuments({ status: 'In Progress' }),
            Task.countDocuments({ status: 'Completed' }),
            Task.countDocuments({ status: 'Issue Reported' })
        ]);
        const completionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : 0;

        // 3. Personnel stats
        const [totalPersonnel, onDutyPersonnel, onLeavePersonnel] = await Promise.all([
            User.countDocuments({ role: 'personnel' }),
            User.countDocuments({ role: 'personnel', status: 'On Duty' }),
            User.countDocuments({ role: 'personnel', status: 'On Leave' })
        ]);

        // 4. Complaint stats
        const [totalComplaints, pendingComplaints, resolvedComplaints] = await Promise.all([
            Complaint.countDocuments(),
            Complaint.countDocuments({ status: 'pending' }),
            Complaint.countDocuments({ status: 'resolved' })
        ]);

        // 5. Zone stats
        const zones = await Zone.find();
        const totalServicePoints = zones.reduce((acc, z) => acc + (z.areas ? z.areas.length : 0), 0);
        const criticalZones = zones.filter(z => z.healthScore < 60 || z.status === 'Critical');

        // 6. Alerts — critical zones + issue tasks
        const issueTaskList = await Task.find({ status: 'Issue Reported' })
            .limit(3)
            .populate('zoneId', 'name');

        const alerts = [
            ...criticalZones.slice(0, 2).map(z => ({
                id: z._id,
                title: 'Critical Zone Health',
                priority: 'High',
                location: z.name,
                details: `Health Score: ${z.healthScore}%. Immediate attention required.`,
                time: (z as any).updatedAt
            })),
            ...issueTaskList.map(t => ({
                id: t._id,
                title: `Issue Reported: ${t.title}`,
                priority: 'Medium',
                location: t.location || (t.zoneId as any)?.name || 'Unknown',
                details: t.description || 'Driver reported an issue during route.',
                time: (t as any).updatedAt
            }))
        ];

        // 7. Recent activity logs
        const recentLogs = await ActivityLog.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .select('action details type createdAt');

        return res.json({
            success: true,
            vehicles: { total: totalVehicles, active: activeVehicles, maintenance: maintenanceVehicles },
            tasks: { total: totalTasks, pending: pendingTasks, accepted: acceptedTasks, inProgress: inProgressTasks, completed: completedTasks, issueReported: issueTasks, completionRate: parseFloat(completionRate as string) },
            personnel: { total: totalPersonnel, onDuty: onDutyPersonnel, onLeave: onLeavePersonnel, offDuty: totalPersonnel - onDutyPersonnel - onLeavePersonnel },
            complaints: { total: totalComplaints, pending: pendingComplaints, resolved: resolvedComplaints },
            zones: { total: zones.length, servicePoints: totalServicePoints, critical: criticalZones.length },
            alerts: alerts.slice(0, 5),
            logs: recentLogs
        });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
