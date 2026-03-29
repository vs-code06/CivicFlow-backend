import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IActivityLog extends Document {
    action: string;
    user?: mongoose.Types.ObjectId;
    details?: string;
    type: 'Info' | 'Warning' | 'Error' | 'Success';
    createdAt: Date;
    updatedAt: Date;
}

const activityLogSchema = new Schema<IActivityLog>({
    action: {
        type: String,
        required: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    details: {
        type: String
    },
    type: {
        type: String,
        enum: ['Info', 'Warning', 'Error', 'Success'],
        default: 'Info'
    }
}, {
    timestamps: true
});

const ActivityLog: Model<IActivityLog> = mongoose.models.ActivityLog || mongoose.model<IActivityLog>('ActivityLog', activityLogSchema);
export default ActivityLog;
