const mongoose = require('mongoose');

const zoneSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    manager: {
        type: String, // e.g. "Sarah Jenkins"
        default: 'Unassigned'
    },
    status: {
        type: String,
        enum: ['Good', 'Attention', 'Critical'],
        default: 'Good'
    },
    healthScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 100
    },
    tasks: {
        type: Number,
        default: 0
    },
    issues: {
        type: Number,
        default: 0
    },
    // Efficiency Tracking
    efficiencyHistory: [{
        date: { type: String }, // YYYY-MM-DD
        score: { type: Number },
        metrics: {
            onTimeRate: Number,
            contaminationRate: Number,
            issuesReported: Number
        }
    }],
    currentMetrics: {
        totalCollections: { type: Number, default: 0 },
        perfectCollections: { type: Number, default: 0 },
        contaminatedCollections: { type: Number, default: 0 },
        blockedCollections: { type: Number, default: 0 },
        missedCollections: { type: Number, default: 0 }
    },
    coordinates: {
        lat: Number,
        lng: Number
    },
    //     type: [Number], // [lat, lng] or GeoJSON in future
    //     default: []
    areas: [{
        name: { type: String, required: true },
        type: { type: [String] },
        status: { type: String, enum: ['good', 'attention', 'critical'], default: 'good' },
        cleanlinessScore: { type: Number, default: 100 },
        issues: { type: Number, default: 0 },
        lastVisit: { type: String },
        nextPickup: { type: String },
        coordinates: {
            lat: Number,
            lng: Number
        }
    }],
    // Weekly Schedule for the Zone
    schedule: [{
        day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
        types: [{ type: String, enum: ['trash', 'recycle', 'compost', 'bulk'] }],
        startTime: { type: String, default: '08:00' },
        endTime: { type: String, default: '16:00' }
    }],
    // Service Alerts/Announcements
    alerts: [{
        type: { type: String, enum: ['info', 'warning', 'critical', 'success'], default: 'info' },
        title: { type: String },
        message: { type: String },
        active: { type: Boolean, default: true },
        createdAt: { type: Date, default: Date.now }
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Zone', zoneSchema);
