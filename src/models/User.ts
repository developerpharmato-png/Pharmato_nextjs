import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    name?: string;
    mobile?: string;
    countryCode?: string;
    email?: string;
    otp?: string;
    otpExpires?: Date;
    refreshToken?: string;
    deviceToken?: string;
    socialProvider?: string;
    socialId?: string;
    isVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
    name: { type: String },
    mobile: { type: String, required: false, unique: true },
    countryCode: { type: String },
    email: { type: String, unique: false },
    otp: { type: String },
    otpExpires: { type: Date },
    refreshToken: { type: String },
    deviceToken: { type: String },
    socialProvider: { type: String },
    socialId: { type: String },
    isVerified: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
