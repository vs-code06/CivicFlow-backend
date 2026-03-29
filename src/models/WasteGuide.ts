import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IWasteGuide extends Document {
    name: string;
    type: 'Recycle' | 'Compost' | 'Hazardous' | 'Trash' | 'Other';
    category: string;
    disposalSteps: string[];
    tip?: string;
    createdAt: Date;
    updatedAt: Date;
}

const wasteGuideSchema = new Schema<IWasteGuide>({
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['Recycle', 'Compost', 'Hazardous', 'Trash', 'Other'],
        required: true
    },
    category: {
        type: String,
        required: true
    },
    disposalSteps: [{
        type: String
    }],
    tip: {
        type: String
    }
}, {
    timestamps: true
});

const WasteGuide: Model<IWasteGuide> = mongoose.models.WasteGuide || mongoose.model<IWasteGuide>('WasteGuide', wasteGuideSchema);
export default WasteGuide;
