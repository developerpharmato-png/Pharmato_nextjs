import mongoose, { Document, Schema } from 'mongoose';
import Counter from './Counter';

export interface ISubCategory extends Document {
    name: string;
    description: string;
    categoryId: mongoose.Types.ObjectId;
    isOTC: boolean; // Over-the-counter flag
    images: string[];
    isActive: boolean;
    uniqueCode: string;
    createdAt: Date;
    updatedAt: Date;
}

const SubCategorySchema = new Schema<ISubCategory>({
    name: {
        type: String,
        maxlength: [100, 'Name cannot be more than 100 characters'],
        trim: true,
    },
    description: {
        type: String,
        maxlength: [500, 'Description cannot be more than 500 characters'],
    },
    categoryId: {
        type: Schema.Types.ObjectId,
        ref: 'Category',
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

// Index for faster queries
SubCategorySchema.index({ categoryId: 1 });

// Assign uniqueCode using atomic counter to avoid duplicates on concurrent inserts
SubCategorySchema.pre('validate', async function (next) {
    try {
        if (this.isNew && !this.uniqueCode) {
            const counter = await Counter.findOneAndUpdate(
                { key: 'SUB' },
                { $inc: { seq: 1 } },
                { new: true, upsert: true }
            );
            this.uniqueCode = `SUB-${counter.seq}`;
        }
        next();
    } catch (err) {
        next(err as Error);
    }
});

export default mongoose.models.SubCategory || mongoose.model<ISubCategory>('SubCategory', SubCategorySchema);
