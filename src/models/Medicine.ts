import mongoose from 'mongoose';
const { Schema } = mongoose;
export interface IMedicine {
    uniqueIdentity: string;
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
    margData?: any;
}

const MedicineSchema = new Schema<IMedicine>({
    margData: {
        type: Schema.Types.Mixed,
        required: false,
        default: {},
    },
    uniqueIdentity: {
        type: String,
        required: false,
        unique: true,
        default: '',
        maxlength: [100, 'Unique identity cannot be more than 100 characters'],
    },
    name: {
        type: String,
        required: false,
        default: 'Unnamed',
        maxlength: [100, 'Name cannot be more than 100 characters'],
    },
    description: {
        type: String,
        required: false,
        default: '',
        maxlength: [500, 'Description cannot be more than 500 characters'],
    },
    manufacturer: {
        type: String,
        required: false,
        default: 'Unknown',
        maxlength: [100, 'Manufacturer cannot be more than 100 characters'],
    },
    category: {
        type: String,
        required: false,
        default: 'Other',
        enum: ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Drops', 'Other'],
    },
    categoryId: {
        type: Schema.Types.ObjectId,
        ref: 'Category',
        required: false,
        default: null,
    },
    subCategoryId: {
        type: Schema.Types.ObjectId,
        ref: 'SubCategory',
        required: false,
        default: null,
    },
    isOTC: {
        type: Boolean,
        default: false,
        required: false,
    },
    isPrescription: {
        type: Boolean,
        default: false,
        required: false,
    },
    price: {
        type: Number,
        required: false,
        default: 0,
        min: [0, 'Price cannot be negative'],
    },
    purchasePrice: {
        type: Number,
        required: false,
        default: 0,
        min: [0, 'Purchase price cannot be negative'],
    },
    mrp: {
        type: Number,
        required: false,
        default: 0,
        min: [0, 'MRP cannot be negative'],
    },
    discount: {
        type: Number,
        required: false,
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
        required: false,
        default: 0,
        min: [0, 'Stock cannot be negative'],
    },
    expiryDate: {
        type: Date,
        required: false,
        default: null,
    },
    batchNumber: {
        type: String,
        required: false,
        default: '',
        unique: false,
    },
    composition: [
        {
            name: { type: String, required: false, default: '' },
            value: { type: String, required: false, default: '' },
        }
    ],
    images: [
        { type: String, required: false, default: '' }
    ],
    highlights: [
        { type: String, required: false, default: '' }
    ],
    relatedProducts: [
        { type: Schema.Types.ObjectId, ref: 'Medicine', required: false, default: null }
    ],
    rating: {
        average: { type: Number, default: 0 },
        count: { type: Number, default: 0 },
    },
    isActive: {
        type: Boolean,
        default: true,
        required: false,
    },
    isDeleted: {
        type: Boolean,
        default: false,
        required: false,
    },
}, {
    timestamps: true,
});

export default mongoose.models.Medicine || mongoose.model<IMedicine>('Medicine', MedicineSchema);