import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IInspection extends Document {
    vehicleId: mongoose.Types.ObjectId;
    driverId: mongoose.Types.ObjectId;
    date: Date;
    passed: boolean;
    checklist: Map<string, boolean>;
    issues?: string;
    createdAt: Date;
    updatedAt: Date;
}

const inspectionSchema = new Schema<IInspection>({
    vehicleId: {
        type: Schema.Types.ObjectId,
        ref: 'Vehicle',
        required: true
    },
    driverId: {
        type: Schema.Types.ObjectId,
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
        of: Boolean,
        required: true
    },
    issues: {
        type: String
    }
}, {
    timestamps: true
});

const Inspection: Model<IInspection> = mongoose.models.Inspection || mongoose.model<IInspection>('Inspection', inspectionSchema);
export default Inspection;
