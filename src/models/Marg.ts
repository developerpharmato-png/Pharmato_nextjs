
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMarg extends Document {
    margGetDataCount: number;
    margInsertDataCount: number;
    margUpdateDataCount: number;
    status: string;
    type: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const MargSchema: Schema<IMarg> = new Schema(
    {
        margGetDataCount: { type: Number , default: 0},
        margInsertDataCount: { type: Number , default: 0},
        margUpdateDataCount: { type: Number, default: 0},
        status: { type: String, default: '' },
        type: { type: String, default: '' }
    },
    {
        timestamps: true,
    }
);

const Marg: Model<IMarg> = mongoose.models.Marg || mongoose.model<IMarg>('Marg', MargSchema);

export default Marg;
