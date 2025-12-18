import mongoose, { Schema, Document } from 'mongoose';

export interface IGuestCart extends Document {
    guestId: string;
    storeId: mongoose.Types.ObjectId;
    items: Array<{
        medicineId: mongoose.Types.ObjectId;
        quantity: number;
    }>;
    createdAt: Date;
    updatedAt: Date;
}

const GuestCartSchema = new Schema<IGuestCart>({
    guestId: { type: String, required: true },
    storeId: { type: Schema.Types.ObjectId, ref: 'Store' },
    items: [
        {
            medicineId: { type: Schema.Types.ObjectId, ref: 'Medicine', required: true },
            quantity: { type: Number, min: 1, required: true }
        }
    ]
}, { timestamps: true });

export default mongoose.models.GuestCart || mongoose.model<IGuestCart>('GuestCart', GuestCartSchema);
