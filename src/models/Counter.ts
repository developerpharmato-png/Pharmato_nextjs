import mongoose, { Schema, model, models, Document } from 'mongoose';

export interface ICounter extends Document {
    key: string;
    seq: number;
}

const CounterSchema = new Schema<ICounter>({
    key: { type: String, required: true, unique: true },
    seq: { type: Number, required: true, default: 0 },
});

export default models.Counter || model<ICounter>('Counter', CounterSchema);
