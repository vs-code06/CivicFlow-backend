const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: function () { return !this.isGoogleUser; }
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    isGoogleUser: {
        type: Boolean,
        default: false
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    role: {
        type: String,
        enum: ['admin', 'personnel', 'resident'],
        default: 'resident'
    },
    avatar: {
        type: String
    },
    refreshToken: {
        type: String
    },
    // User Preferences
    notificationPreferences: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
        vehicleUpdates: { type: Boolean, default: false }
    },
    // Admin API Keys
    apiKeys: [{
        key: { type: String }, // Hashed ideally, but for now storing string
        name: { type: String },
        created: { type: Date, default: Date.now },
        active: { type: Boolean, default: true }
    }],
    // Personnel Specific Fields
    phone: {
        type: String, // e.g., for personnel contact
    },
    status: {
        type: String,
        enum: ['On Duty', 'Off Duty', 'On Leave'],
        default: 'Off Duty',
        required: function () { return this.role === 'personnel'; }
    },
    currentAssignment: {
        type: String, // Could be a Route ID or Vehicle ID
        default: null
    },
    // Resident Specific Fields
    address: {
        type: String
    },
    assignedVehicle: {
        type: String,
        default: null
    },
    zoneId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Zone',
        default: null
    },
    leaveBalances: {
        vacation: { type: Number, default: 20 },
        sick: { type: Number, default: 10 },
        personal: { type: Number, default: 5 }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);
