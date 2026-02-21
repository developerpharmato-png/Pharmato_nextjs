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
    isActive?: boolean;
    userDeActiveBy: string;
    isDelete?: boolean;
    walletAmount?: number;
    uniqueCode: string;
    createdAt: Date;
    updatedAt: Date;
    // Added for OTP and block logic
    incorrectOtpAttempt?: number;
    otpCount?: number;
    otpGenerateTime?: Date;
    isBlocked?: boolean;
    userBlockedTime?: Date;
    isNewUser?: boolean;
}

const UserSchema = new Schema<IUser>({
    name: { type: String },
    mobile: { type: String },
    countryCode: { type: String },
    email: { type: String, unique: false },
    otp: { type: String },
    otpExpires: { type: Date },
    refreshToken: { type: String },
    deviceToken: { type: String },
    socialProvider: { type: String },
    socialId: { type: String },
    isVerified: { type: Boolean, default: false }, 
    walletAmount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    userDeActiveBy: { type: String, default: "" }, // 'admin' or ''
    isDelete: { type: Boolean, default: false },
    uniqueCode: { type: String },
    // Added for OTP and block logic
    incorrectOtpAttempt: { type: Number, default: 0 },
    otpCount: { type: Number, default: 0 },
    otpGenerateTime: { type: Date },
    isBlocked: { type: Boolean, default: false },
    userBlockedTime: { type: Date },
    isNewUser: { type: Boolean, default: false },
}, { timestamps: true });

// Auto-generate sequential uniqueCode on new user creation (reference: Category model)
UserSchema.pre('validate', async function (next) {
    if (this.isNew && !(this as any).uniqueCode) {
        const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
        const count = await User.countDocuments();
        (this as any).uniqueCode = `CUST-${count + 1}`;
    }
    next();
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
