import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ILeaveRequest extends Document {
    personnelId: mongoose.Types.ObjectId;
    startDate: Date;
    endDate: Date;
    reason: string;
    type: 'Sick' | 'Vacation' | 'Personal' | 'Emergency';
    status: 'Pending' | 'Approved' | 'Rejected';
    createdAt: Date;
    updatedAt: Date;
}

const leaveRequestSchema = new Schema<ILeaveRequest>({
    personnelId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['Sick', 'Vacation', 'Personal', 'Emergency'],
        default: 'Personal'
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    }
}, {
    timestamps: true
});

const LeaveRequest: Model<ILeaveRequest> = mongoose.models.LeaveRequest || mongoose.model<ILeaveRequest>('LeaveRequest', leaveRequestSchema);
export default LeaveRequest;
