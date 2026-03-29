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
const taskSchema = new mongoose_1.Schema({
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
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Zone',
        default: null
    },
    estimatedTime: {
        type: String
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
    type: {
        type: String,
        enum: ['Regular', 'Emergency', 'Bulk', 'General', 'Inspection'],
        default: 'Regular'
    },
    targetAreaId: {
        type: mongoose_1.Schema.Types.ObjectId,
        default: null
    },
    checkpoints: [{
            location: String,
            instruction: String,
            completed: { type: Boolean, default: false }
        }],
    assignedTo: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    vehicleId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Vehicle',
        default: null
    },
    dueDate: {
        type: String
    },
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
const Task = mongoose_1.default.models.Task || mongoose_1.default.model('Task', taskSchema);
exports.default = Task;
