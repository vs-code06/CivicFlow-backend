"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const userSchema = new mongoose_1.Schema({
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
    notificationPreferences: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
        vehicleUpdates: { type: Boolean, default: false }
    },
    apiKeys: [{
            key: { type: String },
            name: { type: String },
            created: { type: Date, default: Date.now },
            active: { type: Boolean, default: true }
        }],
    phone: {
        type: String,
    },
    status: {
        type: String,
        enum: ['On Duty', 'Off Duty', 'On Leave'],
        default: 'Off Duty',
        required: function () { return this.role === 'personnel'; }
    },
    currentAssignment: {
        type: String,
        default: null
    },
    address: {
        type: String
    },
    assignedVehicle: {
        type: String,
        default: null
    },
    zoneId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
const User = mongoose_1.default.models.User || mongoose_1.default.model('User', userSchema);
exports.default = User;
