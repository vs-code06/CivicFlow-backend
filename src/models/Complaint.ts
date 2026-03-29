import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IUpdate {
    date: Date;
    message: string;
    active: boolean;
}

export interface IComplaint extends Document {
    residentId: mongoose.Types.ObjectId;
    type: 'Missed Pickup' | 'Damaged Bin' | 'Overflowing Dumpster' | 'Street Light' | 'Graffiti' | 'Other';
    description: string;
    location: string;
    status: 'pending' | 'in-progress' | 'resolved' | 'rejected';
    priority: 'low' | 'medium' | 'high';
    updates: IUpdate[];
    imageUrl?: string;
    assignedTo?: mongoose.Types.ObjectId | null;
    zoneId?: mongoose.Types.ObjectId | null;
    createdAt: Date;
    updatedAt: Date;
}

const complaintSchema = new Schema<IComplaint>({
    residentId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['Missed Pickup', 'Damaged Bin', 'Overflowing Dumpster', 'Street Light', 'Graffiti', 'Other']
    },
    description: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'resolved', 'rejected'],
        default: 'pending'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    updates: [{
        date: {
            type: Date,
            default: Date.now
        },
        message: {
            type: String,
            required: true
        },
        active: {
            type: Boolean,
            default: false
        }
    }],
    imageUrl: {
        type: String
    },
    assignedTo: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    zoneId: {
        type: Schema.Types.ObjectId,
        ref: 'Zone',
        default: null
    }
}, {
    timestamps: true
});

const Complaint: Model<IComplaint> = mongoose.models.Complaint || mongoose.model<IComplaint>('Complaint', complaintSchema);
export default Complaint;
