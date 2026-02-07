
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMarg extends Document {
    margGetDataCount: number;
    margInsertDataCount: number;
    margUpdateDataCount: number;
    status: string;
    type: string;
    dateTime: string;
    margInsertData: [{}];
    jsonData: {};
    createdAt?: Date;
    updatedAt?: Date;
}

const MargSchema: Schema<IMarg> = new Schema(
    {
        margGetDataCount: { type: Number, default: 0 },
        margInsertDataCount: { type: Number, default: 0 },
        margUpdateDataCount: { type: Number, default: 0 },
        status: { type: String, default: '' },
        type: { type: String, default: '' },
        dateTime: { type: String, default: '' },
        margInsertData: [{ type: Object, default: {} }],
        jsonData: { type: Object, default: {} },
    },
    {
        timestamps: true,
    }
);

const Marg: Model<IMarg> = mongoose.models.Marg || mongoose.model<IMarg>('Marg', MargSchema);

export default Marg;
