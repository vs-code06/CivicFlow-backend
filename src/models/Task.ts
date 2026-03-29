import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ICheckpoint {
    location: string;
    instruction: string;
    completed: boolean;
}

export interface ITask extends Document {
    ticketId: string;
    title: string;
    description?: string;
    location: string;
    zoneId?: mongoose.Types.ObjectId | null;
    estimatedTime?: string;
    status: 'Pending' | 'Accepted' | 'In Progress' | 'Review' | 'Completed' | 'Issue Reported';
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    type: 'Regular' | 'Emergency' | 'Bulk' | 'General' | 'Inspection';
    targetAreaId?: mongoose.Types.ObjectId | null;
    checkpoints: ICheckpoint[];
    assignedTo?: mongoose.Types.ObjectId | null;
    vehicleId?: mongoose.Types.ObjectId | null;
    dueDate?: string;
    completedAt?: Date;
    collectionStatus: 'Perfect' | 'Contaminated' | 'Blocked' | 'Missed' | 'Partial';
    startedAt?: Date;
    notes: string;
    issueDescription?: string;
    collectionPhotos: string[];
    createdAt: Date;
    updatedAt: Date;
}

const taskSchema = new Schema<ITask>({
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
        type: Schema.Types.ObjectId,
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
        type: Schema.Types.ObjectId,
        default: null
    },
    checkpoints: [{
        location: String,
        instruction: String,
        completed: { type: Boolean, default: false }
    }],
    assignedTo: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    vehicleId: {
        type: Schema.Types.ObjectId,
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

const Task: Model<ITask> = mongoose.models.Task || mongoose.model<ITask>('Task', taskSchema);
export default Task;
