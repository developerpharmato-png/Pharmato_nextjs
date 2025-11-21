import mongoose, { Document, Schema } from 'mongoose';

export interface ISubCategory extends Document {
    name: string;
    description: string;
    categoryId: mongoose.Types.ObjectId;
    isOTC: boolean; // Over-the-counter flag
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const SubCategorySchema = new Schema<ISubCategory>({
    name: {
        type: String,
        required: [true, 'Please provide subcategory name'],
        maxlength: [100, 'Name cannot be more than 100 characters'],
        trim: true,
    },
    description: {
        type: String,
        required: [true, 'Please provide description'],
        maxlength: [500, 'Description cannot be more than 500 characters'],
    },
    categoryId: {
        type: Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Please provide category'],
    },
    isOTC: {
        type: Boolean,
        default: false,
        required: [true, 'Please specify if this is an over-the-counter subcategory'],
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});

// Index for faster queries
SubCategorySchema.index({ categoryId: 1 });

export default mongoose.models.SubCategory || mongoose.model<ISubCategory>('SubCategory', SubCategorySchema);
