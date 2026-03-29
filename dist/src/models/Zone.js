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
const zoneSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    manager: {
        type: String,
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
    efficiencyHistory: [{
            date: { type: String },
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
    schedule: [{
            day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
            types: [{ type: String, enum: ['trash', 'recycle', 'compost', 'bulk'] }],
            startTime: { type: String, default: '08:00' },
            endTime: { type: String, default: '16:00' }
        }],
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
const Zone = mongoose_1.default.models.Zone || mongoose_1.default.model('Zone', zoneSchema);
exports.default = Zone;
