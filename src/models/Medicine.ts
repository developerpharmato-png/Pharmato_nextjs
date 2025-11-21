import mongoose, { Document, Schema } from 'mongoose';

export interface IMedicine extends Document {
    name: string;
    description: string;
    manufacturer: string;
    category: string;
    categoryId?: mongoose.Types.ObjectId;
    subCategoryId?: mongoose.Types.ObjectId;
    price: number; // selling price
    purchasePrice: number; // purchase price
    mrp: number; // mrp
    discount: number; // percent difference between mrp and price
    stock: number;
    expiryDate: Date;
    batchNumber: string;
    isOTC: boolean;
    isPrescription: boolean;
    isActive: boolean;
    isDeleted?: boolean;
    composition: { name: string; value: string }[];
    images: string[];
    highlights: string[];
    relatedProducts: mongoose.Types.ObjectId[];
    rating?: {
        average: number;
        count: number;
    };
    createdAt: Date;
    updatedAt: Date;
}

const MedicineSchema = new Schema<IMedicine>({
    name: {
        type: String,
        required: [true, 'Please provide medicine name'],
        maxlength: [100, 'Name cannot be more than 100 characters'],
    },
    description: {
        type: String,
        required: [true, 'Please provide description'],
        maxlength: [500, 'Description cannot be more than 500 characters'],
    },
    manufacturer: {
        type: String,
        required: [true, 'Please provide manufacturer'],
        maxlength: [100, 'Manufacturer cannot be more than 100 characters'],
    },
    category: {
        type: String,
        required: [true, 'Please provide category'],
        enum: ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Drops', 'Other'],
    },
    categoryId: {
        type: Schema.Types.ObjectId,
        ref: 'Category',
        required: false,
    },
    subCategoryId: {
        type: Schema.Types.ObjectId,
        ref: 'SubCategory',
        required: false,
    },
    isOTC: {
        type: Boolean,
        default: false,
        required: [true, 'Please specify if this is an over-the-counter medicine'],
    },
    isPrescription: {
        type: Boolean,
        default: false,
        required: [true, 'Please specify if this is a prescription medicine'],
    },
    price: {
        type: Number,
        required: [true, 'Please provide selling price'],
        min: [0, 'Price cannot be negative'],
    },
    purchasePrice: {
        type: Number,
        required: [true, 'Please provide purchase price'],
        min: [0, 'Purchase price cannot be negative'],
    },
    mrp: {
        type: Number,
        required: [true, 'Please provide MRP'],
        min: [0, 'MRP cannot be negative'],
    },
    discount: {
        type: Number,
        required: true,
        min: [0, 'Discount cannot be negative'],
        max: [100, 'Discount cannot be more than 100%'],
        default: function () {
            if (this.mrp && this.price) {
                return Math.round(((this.mrp - this.price) / this.mrp) * 100);
            }
            return 0;
        }
    },
    stock: {
        type: Number,
        required: [true, 'Please provide stock quantity'],
        min: [0, 'Stock cannot be negative'],
    },
    expiryDate: {
        type: Date,
        required: [true, 'Please provide expiry date'],
    },
    batchNumber: {
        type: String,
        required: [true, 'Please provide batch number'],
        unique: true,
    },
    composition: [
        {
            name: { type: String, required: true },
            value: { type: String, required: true },
        }
    ],
    images: [
        { type: String, required: false }
    ],
    highlights: [
        { type: String, required: false }
    ],
    relatedProducts: [
        { type: Schema.Types.ObjectId, ref: 'Medicine', required: false }
    ],
    rating: {
        average: { type: Number, default: 0 },
        count: { type: Number, default: 0 },
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

export default mongoose.models.Medicine || mongoose.model<IMedicine>('Medicine', MedicineSchema);