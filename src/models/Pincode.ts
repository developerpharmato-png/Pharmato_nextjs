import mongoose, { Schema, Document } from 'mongoose';

export interface IPincode extends Document {
    pincode: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const PincodeSchema = new Schema<IPincode>({
    pincode: { type: String, required: true, unique: true },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.models.Pincode || mongoose.model<IPincode>('Pincode', PincodeSchema);
