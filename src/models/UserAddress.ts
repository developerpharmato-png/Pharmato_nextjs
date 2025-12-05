import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IUserAddress extends Document {
    userId: Types.ObjectId;
    addressType?: string;
    name?: string;
    phone?: string;
    email?: string;
    address?: Record<string, any>;
    billing?: Record<string, any>;
    is_primary?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

const UserAddressSchema = new Schema<IUserAddress>({
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    addressType: { type: String, trim: true, default: '' },
    name: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, default: '', required: false },
    address: { type: Object, default: {} },
    billing: { type: Object, default: {} },
    is_primary: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.UserAddress || mongoose.model<IUserAddress>('UserAddress', UserAddressSchema);
