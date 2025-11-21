import mongoose, { Document, Schema } from 'mongoose';

export interface ICategory extends Document {
    name: string;
    description: string;
    isOTC: boolean; // Over-the-counter flag
    icon?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>({
    name: {
        type: String,
        required: [true, 'Please provide category name'],
        unique: true,
        maxlength: [100, 'Name cannot be more than 100 characters'],
        trim: true,
    },
    description: {
        type: String,
        required: [true, 'Please provide description'],
        maxlength: [500, 'Description cannot be more than 500 characters'],
    },
    isOTC: {
        type: Boolean,
        default: false,
        required: [true, 'Please specify if this is an over-the-counter category'],
    },
    icon: {
        type: String,
        default: '💊',
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});

export default mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);
