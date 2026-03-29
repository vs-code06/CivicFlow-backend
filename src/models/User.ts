import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IUser extends Document {
    name: string;
    email: string;
    password?: string;
    googleId?: string;
    isGoogleUser: boolean;
    resetPasswordToken?: string;
    resetPasswordExpire?: Date;
    role: 'admin' | 'personnel' | 'resident';
    avatar?: string;
    refreshToken?: string;
    notificationPreferences: {
        email: boolean;
        sms: boolean;
        vehicleUpdates: boolean;
    };
    apiKeys: {
        key?: string;
        name?: string;
        created: Date;
        active: boolean;
    }[];
    phone?: string;
    status: 'On Duty' | 'Off Duty' | 'On Leave';
    currentAssignment?: string | null;
    address?: string;
    assignedVehicle?: string | null;
    zoneId?: mongoose.Types.ObjectId | null;
    leaveBalances: {
        vacation: number;
        sick: number;
        personal: number;
    };
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new Schema<IUser>({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: function (this: any) { return !this.isGoogleUser; }
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    isGoogleUser: {
        type: Boolean,
        default: false
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    role: {
        type: String,
        enum: ['admin', 'personnel', 'resident'],
        default: 'resident'
    },
    avatar: {
        type: String
    },
    refreshToken: {
        type: String
    },
    notificationPreferences: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
        vehicleUpdates: { type: Boolean, default: false }
    },
    apiKeys: [{
        key: { type: String },
        name: { type: String },
        created: { type: Date, default: Date.now },
        active: { type: Boolean, default: true }
    }],
    phone: {
        type: String,
    },
    status: {
        type: String,
        enum: ['On Duty', 'Off Duty', 'On Leave'],
        default: 'Off Duty',
        required: function (this: any) { return this.role === 'personnel'; }
    },
    currentAssignment: {
        type: String,
        default: null
    },
    address: {
        type: String
    },
    assignedVehicle: {
        type: String,
        default: null
    },
    zoneId: {
        type: Schema.Types.ObjectId,
        ref: 'Zone',
        default: null
    },
    leaveBalances: {
        vacation: { type: Number, default: 20 },
        sick: { type: Number, default: 10 },
        personal: { type: Number, default: 5 }
    }
}, {
    timestamps: true
});

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
export default User;
