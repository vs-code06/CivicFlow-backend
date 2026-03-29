import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IAnnouncement extends Document {
    title: string;
    content: string;
    type: 'Alert' | 'Info' | 'Tip';
    date: Date;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const announcementSchema = new Schema<IAnnouncement>({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['Alert', 'Info', 'Tip'],
        default: 'Info'
    },
    date: {
        type: Date,
        default: Date.now
    },
    active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const Announcement: Model<IAnnouncement> = mongoose.models.Announcement || mongoose.model<IAnnouncement>('Announcement', announcementSchema);
export default Announcement;
