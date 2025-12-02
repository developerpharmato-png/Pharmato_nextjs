import mongoose, { Document, Schema } from 'mongoose';
import Counter from './Counter';

export interface ICategory extends Document {
    name: string;
    description: string;
    isOTC: boolean; // Over-the-counter flag
    images: string[];
    isActive: boolean;
    uniqueCode: string;
    createdAt: Date;
    updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>({
    name: {
        type: String,
        maxlength: [100, 'Name cannot be more than 100 characters'],
        trim: true,
    },
    description: {
        type: String,
        maxlength: [500, 'Description cannot be more than 500 characters'],
    },
    isOTC: {
        type: Boolean,
        default: false,
    },
    images: [
        {
            type: String,
        }
    ],
    isActive: {
        type: Boolean,
        default: true,
    },
    uniqueCode: {
        type: String,
        unique: true,
        index: true,
    },
}, {
    timestamps: true,
});

// Assign uniqueCode using atomic counter to avoid duplicates
CategorySchema.pre('validate', async function (next) {
    try {
        if (this.isNew && !this.uniqueCode) {
            const counter = await Counter.findOneAndUpdate(
                { key: 'CAT' },
                { $inc: { seq: 1 } },
                { new: true, upsert: true }
            );
            this.uniqueCode = `CAT-${counter.seq}`;
        }
        next();
    } catch (err) {
        next(err as Error);
    }
});

export default mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);
