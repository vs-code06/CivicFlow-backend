const mongoose = require('mongoose');

const systemConfigSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        default: 'global_settings' // Singleton pattern by default key
    },
    fleet: {
        lowFuelThreshold: { type: Number, default: 20 },
        wasteCapacityLimit: { type: Number, default: 90 }
    },
    general: {
        maintenanceMode: { type: Boolean, default: false },
        supportEmail: { type: String }
    },
    notifications: {
        enableEmail: { type: Boolean, default: true },
        enableSMS: { type: Boolean, default: false }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('SystemConfig', systemConfigSchema);
