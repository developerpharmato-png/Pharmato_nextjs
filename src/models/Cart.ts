import mongoose, { Schema, Document } from 'mongoose';

export interface ICart extends Document {
    userId: mongoose.Types.ObjectId;
    items: Array<{
        medicineId: mongoose.Types.ObjectId;
        quantity: number;
    }>;
    createdAt: Date;
    updatedAt: Date;
}

const CartSchema = new Schema<ICart>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    items: [
        {
            medicineId: { type: Schema.Types.ObjectId, ref: 'Medicine', required: true },
            quantity: { type: Number, required: true, min: 1 }
        }
    ]
}, { timestamps: true });

export default mongoose.models.Cart || mongoose.model<ICart>('Cart', CartSchema);
