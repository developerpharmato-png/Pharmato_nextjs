import mongoose, { Document, Schema } from 'mongoose';

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
        required: true,
    },
}, {
    timestamps: true,
});

// Auto-increment uniqueCode on new category creation
CategorySchema.pre('validate', async function (next) {
    if (this.isNew && !this.uniqueCode) {
        const Category = mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);
        const count = await Category.countDocuments();
        this.uniqueCode = `CAT-${count + 1}`;
    }
    next();
});

export default mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);
