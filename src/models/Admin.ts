import mongoose, { Document, Schema } from 'mongoose';

export interface IAdmin extends Document {
    name: string;
    email: string;
    password: string;
    roleId?: any;
    isActive?: boolean;
    resetPasswordToken?: string | null;
    resetPasswordExpires?: Date | null;
    sessionToken?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

const AdminSchema = new Schema<IAdmin>({
    name: {
        type: String,
        maxlength: [60, 'Name cannot be more than 60 characters'],
    },
    email: {
        type: String,

        lowercase: true,
    },
    password: {
        type: String,
        minlength: [6, 'Password must be at least 6 characters'],
    },
    roleId: { type: Schema.Types.ObjectId, ref: 'Role' },
    isActive: { type: Boolean, default: true },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
    sessionToken: { type: String, default: null },
}, {
    timestamps: true,
});

export default mongoose.models.Admin || mongoose.model<IAdmin>('Admin', AdminSchema);
