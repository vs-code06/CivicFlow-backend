import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ISystemConfig extends Document {
    key: string;
    fleet: {
        lowFuelThreshold: number;
        wasteCapacityLimit: number;
    };
    general: {
        maintenanceMode: boolean;
        supportEmail?: string;
    };
    notifications: {
        enableEmail: boolean;
        enableSMS: boolean;
    };
    createdAt: Date;
    updatedAt: Date;
}

const systemConfigSchema = new Schema<ISystemConfig>({
    key: {
        type: String,
        required: true,
        unique: true,
        default: 'global_settings'
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

const SystemConfig: Model<ISystemConfig> = mongoose.models.SystemConfig || mongoose.model<ISystemConfig>('SystemConfig', systemConfigSchema);
export default SystemConfig;
