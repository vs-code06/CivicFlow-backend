const Task = require('../models/Task');
const User = require('../models/User');
const Zone = require('../models/Zone');
const ActivityLog = require('../models/ActivityLog');

// ─── Helper: log activity ─────────────────────────────────────────────────────
const log = async (action, userId, details, type = 'Info') => {
    try {
        await ActivityLog.create({ action, user: userId, details, type });
    } catch (_) { /* non-blocking */ }
};

// ─── Helper: update zone health score after collection ───────────────────────
const updateZoneHealth = async (zoneId, collectionStatus) => {
    try {
        const zone = await Zone.findById(zoneId);
        if (!zone) return;

        if (!zone.currentMetrics) {
            zone.currentMetrics = { totalCollections: 0, perfectCollections: 0, contaminatedCollections: 0, blockedCollections: 0, missedCollections: 0 };
        }

        zone.currentMetrics.totalCollections += 1;
        if (collectionStatus === 'Perfect') zone.currentMetrics.perfectCollections += 1;
        else if (collectionStatus === 'Contaminated') zone.currentMetrics.contaminatedCollections += 1;
        else if (collectionStatus === 'Blocked') zone.currentMetrics.blockedCollections += 1;
        else if (collectionStatus === 'Missed') zone.currentMetrics.missedCollections += 1;

        const { totalCollections, perfectCollections, contaminatedCollections, blockedCollections, missedCollections } = zone.currentMetrics;
        const score = Math.max(0, Math.min(100,
            (perfectCollections * 100
                - contaminatedCollections * 5
                - blockedCollections * 10
                - missedCollections * 15)
            / totalCollections
        ));
        zone.healthScore = Math.round(score);

        // Store in history
        if (!zone.efficiencyHistory) zone.efficiencyHistory = [];
        zone.efficiencyHistory.push({ date: new Date(), score: zone.healthScore, metrics: { ...zone.currentMetrics } });

        await zone.save();
    } catch (_) { /* non-blocking */ }
};

// ─── GET /api/tasks ───────────────────────────────────────────────────────────
// Admin: all tasks with optional filters
// Personnel: only their own tasks
const getTasks = async (req, res) => {
    try {
        const { status, zoneId, priority, search, page = 1, limit = 50 } = req.query;
        const query = {};

        // Personnel only see tasks assigned to them
        if (req.user.role === 'personnel') {
            query.assignedTo = req.user._id;
        }

        if (status && status !== 'All') query.status = status;
        if (zoneId) query.zoneId = zoneId;
        if (priority && priority !== 'All') query.priority = priority;
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { location: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await Task.countDocuments(query);

        const tasks = await Task.find(query)
            .populate('assignedTo', 'name email avatar status phone')
            .populate('vehicleId', 'vehicleId type licensePlate status capacity')
            .populate('zoneId', 'name status healthScore')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        return res.json({ success: true, tasks, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ─── GET /api/tasks/my-zone-status ───────────────────────────────────────────
// Resident: get the active task in their zone (En Route indicator)
const getResidentZoneStatus = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user || !user.zoneId) {
            return res.json({ success: true, task: null });
        }

        const task = await Task.findOne({
            zoneId: user.zoneId,
            status: { $in: ['In Progress', 'Accepted'] }
        })
            .populate('assignedTo', 'name avatar phone')
            .populate('vehicleId', 'vehicleId type licensePlate')
            .sort({ updatedAt: -1 });

        return res.json({ success: true, task: task || null });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ─── GET /api/tasks/stats ─────────────────────────────────────────────────────
// Admin: task statistics
const getTaskStats = async (req, res) => {
    try {
        const [total, pending, accepted, inProgress, completed, issueReported] = await Promise.all([
            Task.countDocuments(),
            Task.countDocuments({ status: 'Pending' }),
            Task.countDocuments({ status: 'Accepted' }),
            Task.countDocuments({ status: 'In Progress' }),
            Task.countDocuments({ status: 'Completed' }),
            Task.countDocuments({ status: 'Issue Reported' })
        ]);
        const completionRate = total > 0 ? ((completed / total) * 100).toFixed(1) : 0;
        return res.json({ success: true, stats: { total, pending, accepted, inProgress, completed, issueReported, completionRate: parseFloat(completionRate) } });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ─── GET /api/tasks/:id ───────────────────────────────────────────────────────
const getTaskById = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id)
            .populate('assignedTo', 'name email avatar status phone')
            .populate('vehicleId', 'vehicleId type licensePlate status capacity')
            .populate('zoneId', 'name status healthScore');

        if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

        // Personnel can only view their own task
        if (req.user.role === 'personnel' && task.assignedTo?._id?.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        return res.json({ success: true, task });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ─── POST /api/tasks ──────────────────────────────────────────────────────────
// Admin only
const createTask = async (req, res) => {
    try {
        const { title, description, location, priority, estimatedTime, zoneId, assignedTo, vehicleId, dueDate, ticketId, type } = req.body;

        if (!title || !zoneId) {
            return res.status(400).json({ success: false, message: 'Title and zone are required' });
        }

        const task = await Task.create({
            title,
            description: description || '',
            location: location || '',
            priority: priority || 'Medium',
            estimatedTime: estimatedTime || '',
            zoneId,
            assignedTo: assignedTo || null,
            vehicleId: vehicleId || null,
            dueDate: dueDate || null,
            ticketId: ticketId || `TK-${Date.now().toString().slice(-6)}`,
            type: type || 'General',
            status: 'Pending'
        });

        // Auto-set assigned driver to On Duty
        if (assignedTo) {
            await User.findByIdAndUpdate(assignedTo, { status: 'On Duty' });
        }

        const populated = await Task.findById(task._id)
            .populate('assignedTo', 'name email avatar status')
            .populate('vehicleId', 'vehicleId type licensePlate status')
            .populate('zoneId', 'name');

        await log('Task Created', req.user._id, `Task "${title}" created at ${location || zoneId}`, 'Info');

        return res.status(201).json({ success: true, task: populated });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ─── PUT /api/tasks/:id ───────────────────────────────────────────────────────
// Admin: update any field
// Personnel: can only update status-related fields (via accept/start/complete endpoints)
const updateTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

        // Personnel can only update their own task
        if (req.user.role === 'personnel') {
            if (task.assignedTo?.toString() !== req.user._id.toString()) {
                return res.status(403).json({ success: false, message: 'You can only update your own tasks' });
            }
            // Personnel can only update these fields
            const { status, collectionStatus, notes } = req.body;
            if (status) task.status = status;
            if (collectionStatus) task.collectionStatus = collectionStatus;
            if (notes) task.notes = notes;
        } else {
            // Admin can update anything
            const prevAssignedTo = task.assignedTo?.toString();
            const { title, description, location, priority, estimatedTime, zoneId, assignedTo, vehicleId, dueDate, status, type } = req.body;

            if (title) task.title = title;
            if (description !== undefined) task.description = description;
            if (location !== undefined) task.location = location;
            if (priority) task.priority = priority;
            if (estimatedTime !== undefined) task.estimatedTime = estimatedTime;
            if (zoneId) task.zoneId = zoneId;
            if (vehicleId !== undefined) task.vehicleId = vehicleId || null;
            if (dueDate !== undefined) task.dueDate = dueDate;
            if (status) task.status = status;
            if (type) task.type = type;

            if (assignedTo !== undefined) {
                // If driver changed, update old driver status
                if (prevAssignedTo && prevAssignedTo !== (assignedTo?.toString() || '')) {
                    const otherActive = await Task.countDocuments({ assignedTo: prevAssignedTo, status: { $in: ['Pending', 'Accepted', 'In Progress'] }, _id: { $ne: task._id } });
                    if (otherActive === 0) {
                        await User.findByIdAndUpdate(prevAssignedTo, { status: 'Off Duty' });
                    }
                }
                task.assignedTo = assignedTo || null;
                // Set new driver On Duty
                if (assignedTo) {
                    await User.findByIdAndUpdate(assignedTo, { status: 'On Duty' });
                }
            }
        }

        await task.save();

        // If task completed: update zone health + free driver if no other tasks
        if (task.status === 'Completed') {
            if (task.zoneId && task.collectionStatus) {
                await updateZoneHealth(task.zoneId, task.collectionStatus);
            }
            if (task.assignedTo) {
                const otherActive = await Task.countDocuments({
                    assignedTo: task.assignedTo,
                    status: { $in: ['Pending', 'Accepted', 'In Progress'] },
                    _id: { $ne: task._id }
                });
                if (otherActive === 0) {
                    await User.findByIdAndUpdate(task.assignedTo, { status: 'Off Duty' });
                }
            }
            await log('Task Completed', req.user._id, `Task "${task.title}" marked as completed`, 'Success');
        }

        const updated = await Task.findById(task._id)
            .populate('assignedTo', 'name email avatar status')
            .populate('vehicleId', 'vehicleId type licensePlate status')
            .populate('zoneId', 'name status healthScore');

        return res.json({ success: true, task: updated });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ─── POST /api/tasks/:id/accept ───────────────────────────────────────────────
// Personnel: accept a pending task assigned to them
const acceptTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

        if (task.assignedTo?.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'This task is not assigned to you' });
        }

        if (task.status !== 'Pending') {
            return res.status(400).json({ success: false, message: `Task is already ${task.status}` });
        }

        task.status = 'Accepted';
        await task.save();

        // Ensure driver is On Duty
        await User.findByIdAndUpdate(req.user._id, { status: 'On Duty' });

        const updated = await Task.findById(task._id)
            .populate('assignedTo', 'name email avatar status')
            .populate('vehicleId', 'vehicleId type licensePlate status capacity')
            .populate('zoneId', 'name');

        await log('Task Accepted', req.user._id, `"${task.title}" accepted by ${req.user.name}`, 'Info');
        return res.json({ success: true, task: updated });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ─── POST /api/tasks/:id/start ────────────────────────────────────────────────
// Personnel: start an accepted task (begin route)
const startTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

        if (task.assignedTo?.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'This task is not assigned to you' });
        }

        if (task.status !== 'Accepted') {
            return res.status(400).json({ success: false, message: `Task must be Accepted first (current: ${task.status})` });
        }

        task.status = 'In Progress';
        task.startedAt = new Date();
        await task.save();

        const updated = await Task.findById(task._id)
            .populate('assignedTo', 'name email avatar status')
            .populate('vehicleId', 'vehicleId type licensePlate status')
            .populate('zoneId', 'name');

        await log('Task Started', req.user._id, `"${task.title}" started by ${req.user.name}`, 'Info');
        return res.json({ success: true, task: updated });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ─── POST /api/tasks/:id/complete ─────────────────────────────────────────────
// Personnel: complete a task with collection outcome
const completeTask = async (req, res) => {
    try {
        const { collectionStatus, notes } = req.body;
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

        if (task.assignedTo?.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'This task is not assigned to you' });
        }

        if (task.status !== 'In Progress') {
            return res.status(400).json({ success: false, message: `Task must be In Progress to complete (current: ${task.status})` });
        }

        task.status = 'Completed';
        task.collectionStatus = collectionStatus || 'Perfect';
        task.completedAt = new Date();
        if (notes) task.notes = notes;
        await task.save();

        // Update zone health
        if (task.zoneId) await updateZoneHealth(task.zoneId, task.collectionStatus);

        // Free up driver if no other active tasks
        const otherActive = await Task.countDocuments({
            assignedTo: req.user._id,
            status: { $in: ['Pending', 'Accepted', 'In Progress'] },
            _id: { $ne: task._id }
        });
        if (otherActive === 0) {
            await User.findByIdAndUpdate(req.user._id, { status: 'Off Duty' });
        }

        const updated = await Task.findById(task._id)
            .populate('assignedTo', 'name email avatar status')
            .populate('vehicleId', 'vehicleId type licensePlate status')
            .populate('zoneId', 'name status healthScore');

        await log('Task Completed', req.user._id, `"${task.title}" completed — ${task.collectionStatus}`, 'Success');
        return res.json({ success: true, task: updated });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ─── DELETE /api/tasks/:id ────────────────────────────────────────────────────
// Admin only
const deleteTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

        // Free driver
        if (task.assignedTo && task.status !== 'Completed') {
            const otherActive = await Task.countDocuments({ assignedTo: task.assignedTo, status: { $in: ['Pending', 'Accepted', 'In Progress'] }, _id: { $ne: task._id } });
            if (otherActive === 0) await User.findByIdAndUpdate(task.assignedTo, { status: 'Off Duty' });
        }

        await task.deleteOne();
        await log('Task Deleted', req.user._id, `Task "${task.title}" deleted`, 'Warning');
        return res.json({ success: true, message: 'Task deleted' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ─── POST /api/tasks/dispatch-today ──────────────────────────────────────────
const Vehicle = require('../models/Vehicle');

const dispatchToday = async (req, res) => {
    try {
        const { assignedTo, vehicleId } = req.body || {};
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const today = new Date();
        const todayName = days[today.getDay()];

        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);

        // Get all zones with a schedule for today
        const zones = await Zone.find({ 'schedule.day': todayName });
        const created = [];
        const skipped = [];

        for (const zone of zones) {
            // Check if task already exists for this zone today
            const existingTask = await Task.findOne({
                zoneId: zone._id,
                createdAt: { $gte: startOfDay, $lte: endOfDay }
            });

            if (existingTask) {
                skipped.push({ zone: zone.name, reason: 'Task already exists' });
                continue;
            }

            const scheduleEntry = zone.schedule.find(s => s.day === todayName);
            const typesLabel = scheduleEntry.types.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ');

            const taskData = {
                title: `Daily Collection - ${zone.name}`,
                description: `Scheduled ${typesLabel} collection for ${zone.name} (${todayName})`,
                location: zone.name,
                priority: 'Medium',
                estimatedTime: `${scheduleEntry.startTime} - ${scheduleEntry.endTime}`,
                zoneId: zone._id,
                ticketId: `T-OLD-${Date.now().toString().slice(-4)}`,
                type: 'Regular',
                status: 'Pending',
                dueDate: today.toISOString().split('T')[0]
            };

            // If driver and vehicle are specified, assign them
            if (assignedTo) {
                taskData.assignedTo = assignedTo;
                taskData.status = 'Accepted';
            }
            if (vehicleId) {
                taskData.vehicleId = vehicleId;
            }

            const task = await Task.create(taskData);

            created.push({ zone: zone.name, taskId: task._id, types: scheduleEntry.types });
        }

        await log('Dispatch Today', req.user._id, `Dispatched ${created.length} collection tasks for ${todayName}`, 'Info');

        return res.json({
            success: true,
            message: `Dispatched ${created.length} tasks, skipped ${skipped.length}`,
            created,
            skipped
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { getTasks, getTaskById, getResidentZoneStatus, getTaskStats, createTask, updateTask, acceptTask, startTask, completeTask, deleteTask, dispatchToday };
