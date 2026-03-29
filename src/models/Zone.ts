import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IEfficiencyMetric {
    date: string;
    score: number;
    metrics: {
        onTimeRate: number;
        contaminationRate: number;
        issuesReported: number;
    };
}

export interface IArea {
    name: string;
    type: string[];
    status: 'good' | 'attention' | 'critical';
    cleanlinessScore: number;
    issues: number;
    lastVisit?: string;
    nextPickup?: string;
    coordinates: {
        lat: number;
        lng: number;
    };
}

export interface ISchedule {
    day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
    types: ('trash' | 'recycle' | 'compost' | 'bulk')[];
    startTime: string;
    endTime: string;
}

export interface IAlert {
    type: 'info' | 'warning' | 'critical' | 'success';
    title: string;
    message: string;
    active: boolean;
    createdAt: Date;
}

export interface IZone extends Document {
    name: string;
    manager: string;
    status: 'Good' | 'Attention' | 'Critical';
    healthScore: number;
    tasks: number;
    issues: number;
    efficiencyHistory: IEfficiencyMetric[];
    currentMetrics: {
        totalCollections: number;
        perfectCollections: number;
        contaminatedCollections: number;
        blockedCollections: number;
        missedCollections: number;
    };
    coordinates: {
        lat: number;
        lng: number;
    };
    areas: IArea[];
    schedule: ISchedule[];
    alerts: IAlert[];
    createdAt: Date;
    updatedAt: Date;
}

const zoneSchema = new Schema<IZone>({
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

const Zone: Model<IZone> = mongoose.models.Zone || mongoose.model<IZone>('Zone', zoneSchema);
export default Zone;
