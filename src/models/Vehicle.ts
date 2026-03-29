import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IVehicle extends Document {
    vehicleId: string;
    type: string;
    status: 'Active' | 'Maintenance' | 'Available';
    fuelLevel: number;
    driverId?: mongoose.Types.ObjectId | null;
    lastMaintenanceDate?: Date;
    currentRoute?: string;
    licensePlate: string;
    capacity?: string;
    mileage: number;
    insuranceExpiry?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const vehicleSchema = new Schema<IVehicle>({
    vehicleId: {
        type: String,
        required: true,
        unique: true
    },
    type: {
        type: String,
        required: true,
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
        type: Schema.Types.ObjectId,
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
        type: String,
    },
    mileage: {
        type: Number,
        default: 0
    },
    insuranceExpiry: {
        type: Date
    }
}, {
    timestamps: true
});

const Vehicle: Model<IVehicle> = mongoose.models.Vehicle || mongoose.model<IVehicle>('Vehicle', vehicleSchema);
export default Vehicle;
