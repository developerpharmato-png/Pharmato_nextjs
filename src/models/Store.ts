import mongoose, { Schema, Document } from 'mongoose';

export interface IStore extends Document {
    name: string;
    servicePinCodes: string[];
    address?: Record<string, any>;
    status: number;
    adminManagerId?: mongoose.Types.ObjectId;
}

const StoreSchema: Schema = new Schema({
    name: { type: String },
    servicePinCodes: { type: [String], default: [] },
    address: { type: Object, default: {} },
    status: { type: Number, default: 1 },
    adminManagerId: { type: Schema.Types.ObjectId, ref: 'Admin', required: false },
}, { timestamps: true });

export default mongoose.models.Store || mongoose.model<IStore>('Store', StoreSchema);
