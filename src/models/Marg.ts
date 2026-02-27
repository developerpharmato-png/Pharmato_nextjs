
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMarg extends Document {
    uniqueCode?: string;
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
        uniqueCode: {
            type: String
        },
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

// Auto-increment uniqueCode on new medicine creation (count-based) before save
MargSchema.pre('save', async function (next) {
    // @ts-ignore
    if (this.isNew && !this.uniqueCode) {
        const Marg = mongoose.models.Marg || mongoose.model<IMarg>('Marg', MargSchema);
        const count = await Marg.countDocuments();
        // @ts-ignore
        this.uniqueCode = `SYN-${count + 1}`;
    }
    next();
});

const Marg: Model<IMarg> = mongoose.models.Marg || mongoose.model<IMarg>('Marg', MargSchema);

export default Marg;
