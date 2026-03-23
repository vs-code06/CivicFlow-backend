const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    ticketId: {
        type: String,
        required: true,
        unique: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    location: {
        type: String,
        default: ''
    },
    zoneId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Zone',
        default: null
    },
    estimatedTime: {
        type: String // e.g., "2h", "Today", "Tomorrow"
    },
    status: {
        type: String,
        enum: ['Pending', 'Accepted', 'In Progress', 'Review', 'Completed', 'Issue Reported'],
        default: 'Pending'
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Critical'],
        default: 'Medium'
    },
    // Smart Routing Fields
    type: {
        type: String,
        enum: ['Regular', 'Emergency', 'Bulk', 'General', 'Inspection'],
        default: 'Regular'
    },
    targetAreaId: {
        type: mongoose.Schema.Types.ObjectId, // If set, task is for specific area only
        default: null
    },
    checkpoints: [{ // Specific instructions per stop
        location: String,
        instruction: String,
        completed: { type: Boolean, default: false }
    }],
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    vehicleId: {
        type: mongoose.Schema.Types.ObjectId, // Or String if matching custom ID
        ref: 'Vehicle',
        default: null
    },
    dueDate: {
        type: String // or Date
    },
    // Efficiency & Completion Tracking
    completedAt: {
        type: Date
    },
    collectionStatus: {
        type: String,
        enum: ['Perfect', 'Contaminated', 'Blocked', 'Missed', 'Partial'],
        default: 'Perfect'
    },
    startedAt: { type: Date },
    notes: { type: String, default: '' },
    issueDescription: {
        type: String
    },
    collectionPhotos: [{ type: String }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Task', taskSchema);
