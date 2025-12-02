import mongoose, { Document, Schema } from 'mongoose';

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
        required: true,
    },
}, {
    timestamps: true,
});

// Index for faster queries
SubCategorySchema.index({ categoryId: 1 });

// Auto-increment uniqueCode on new subcategory creation (count-based) before save
SubCategorySchema.pre('save', async function (next) {
    if (this.isNew && !this.uniqueCode) {
        const SubCategory = mongoose.models.SubCategory || mongoose.model<ISubCategory>('SubCategory', SubCategorySchema);
        const count = await SubCategory.countDocuments();
        this.uniqueCode = `SUB-${count + 1}`;
    }
    next();
});

export default mongoose.models.SubCategory || mongoose.model<ISubCategory>('SubCategory', SubCategorySchema);
