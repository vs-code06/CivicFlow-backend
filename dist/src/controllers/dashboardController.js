"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardStats = void 0;
const Vehicle_1 = __importDefault(require("../models/Vehicle"));
const Task_1 = __importDefault(require("../models/Task"));
const Zone_1 = __importDefault(require("../models/Zone"));
const User_1 = __importDefault(require("../models/User"));
const Complaint_1 = __importDefault(require("../models/Complaint"));
const ActivityLog_1 = __importDefault(require("../models/ActivityLog"));
// ─── GET /api/dashboard/stats ─────────────────────────────────────────────────
const getDashboardStats = async (req, res) => {
    try {
        // 1. Vehicle stats
        const [totalVehicles, activeVehicles, maintenanceVehicles] = await Promise.all([
            Vehicle_1.default.countDocuments(),
            Vehicle_1.default.countDocuments({ status: 'Active' }),
            Vehicle_1.default.countDocuments({ status: 'Maintenance' })
        ]);
        // 2. Task stats
        const [totalTasks, pendingTasks, acceptedTasks, inProgressTasks, completedTasks, issueTasks] = await Promise.all([
            Task_1.default.countDocuments(),
            Task_1.default.countDocuments({ status: 'Pending' }),
            Task_1.default.countDocuments({ status: 'Accepted' }),
            Task_1.default.countDocuments({ status: 'In Progress' }),
            Task_1.default.countDocuments({ status: 'Completed' }),
            Task_1.default.countDocuments({ status: 'Issue Reported' })
        ]);
        const completionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : 0;
        // 3. Personnel stats
        const [totalPersonnel, onDutyPersonnel, onLeavePersonnel] = await Promise.all([
            User_1.default.countDocuments({ role: 'personnel' }),
            User_1.default.countDocuments({ role: 'personnel', status: 'On Duty' }),
            User_1.default.countDocuments({ role: 'personnel', status: 'On Leave' })
        ]);
        // 4. Complaint stats
        const [totalComplaints, pendingComplaints, resolvedComplaints] = await Promise.all([
            Complaint_1.default.countDocuments(),
            Complaint_1.default.countDocuments({ status: 'pending' }),
            Complaint_1.default.countDocuments({ status: 'resolved' })
        ]);
        // 5. Zone stats
        const zones = await Zone_1.default.find();
        const totalServicePoints = zones.reduce((acc, z) => acc + (z.areas ? z.areas.length : 0), 0);
        const criticalZones = zones.filter(z => z.healthScore < 60 || z.status === 'Critical');
        // 6. Alerts — critical zones + issue tasks
        const issueTaskList = await Task_1.default.find({ status: 'Issue Reported' })
            .limit(3)
            .populate('zoneId', 'name');
        const alerts = [
            ...criticalZones.slice(0, 2).map(z => ({
                id: z._id,
                title: 'Critical Zone Health',
                priority: 'High',
                location: z.name,
                details: `Health Score: ${z.healthScore}%. Immediate attention required.`,
                time: z.updatedAt
            })),
            ...issueTaskList.map(t => ({
                id: t._id,
                title: `Issue Reported: ${t.title}`,
                priority: 'Medium',
                location: t.location || t.zoneId?.name || 'Unknown',
                details: t.description || 'Driver reported an issue during route.',
                time: t.updatedAt
            }))
        ];
        // 7. Recent activity logs
        const recentLogs = await ActivityLog_1.default.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .select('action details type createdAt');
        return res.json({
            success: true,
            vehicles: { total: totalVehicles, active: activeVehicles, maintenance: maintenanceVehicles },
            tasks: { total: totalTasks, pending: pendingTasks, accepted: acceptedTasks, inProgress: inProgressTasks, completed: completedTasks, issueReported: issueTasks, completionRate: parseFloat(completionRate) },
            personnel: { total: totalPersonnel, onDuty: onDutyPersonnel, onLeave: onLeavePersonnel, offDuty: totalPersonnel - onDutyPersonnel - onLeavePersonnel },
            complaints: { total: totalComplaints, pending: pendingComplaints, resolved: resolvedComplaints },
            zones: { total: zones.length, servicePoints: totalServicePoints, critical: criticalZones.length },
            alerts: alerts.slice(0, 5),
            logs: recentLogs
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
exports.getDashboardStats = getDashboardStats;
