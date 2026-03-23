const mongoose = require('mongoose');

const inspectionSchema = new mongoose.Schema({
    vehicleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle',
        required: true
    },
    driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    passed: {
        type: Boolean,
        required: true
    },
    checklist: {
        type: Map,
        of: Boolean, // e.g. { "tires": true, "oil": false }
        required: true
    },
    issues: {
        type: String // Details if passed is false or specific items failed
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Inspection', inspectionSchema);
