const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
    vehicleId: {
        type: String,
        required: true,
        unique: true
    },
    type: {
        type: String,
        required: true, // e.g., 'Compactor', 'Recycler'
    },
    status: {
        type: String,
        enum: ['Active', 'Maintenance', 'Available'],
        default: 'Available'
    },
    fuelLevel: {
        type: Number,
        min: 0,
        max: 100,
        default: 100
    },
    driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    lastMaintenanceDate: {
        type: Date
    },
    currentRoute: {
        type: String
    },
    licensePlate: {
        type: String,
        unique: true
    },
    capacity: {
        type: String, // e.g. "5 Tons"
    },
    mileage: {
        type: Number, // in km
        default: 0
    },
    insuranceExpiry: {
        type: Date
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Vehicle', vehicleSchema);
