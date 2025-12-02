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
        default: {},
    },
    uniqueIdentity: {
        type: String,
        default: '',
        maxlength: [100, 'Unique identity cannot be more than 100 characters'],
    },
    name: {
        type: String,
        default: 'Unnamed',
        maxlength: [100, 'Name cannot be more than 100 characters'],
    },
    description: {
        type: String,
        default: '',
        maxlength: [500, 'Description cannot be more than 500 characters'],
    },
    manufacturer: {
        type: String,
        default: 'Unknown',
        maxlength: [100, 'Manufacturer cannot be more than 100 characters'],
    },
    category: {
        type: String,
        default: 'Other',
        enum: ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Drops', 'Other'],
    },
    categoryId: {
        type: Schema.Types.ObjectId,
        ref: 'Category',
        default: null,
    },
    subCategoryId: {
        type: Schema.Types.ObjectId,
        ref: 'SubCategory',
        default: null,
    },
    isOTC: {
        type: Boolean,
        default: false,
    },
    isPrescription: {
        type: Boolean,
        default: false,
    },
    price: {
        type: Number,
        default: 0,
        min: [0, 'Price cannot be negative'],
    },
    purchasePrice: {
        type: Number,
        default: 0,
        min: [0, 'Purchase price cannot be negative'],
    },
    mrp: {
        type: Number,
        default: 0,
        min: [0, 'MRP cannot be negative'],
    },
    discount: {
        type: Number,
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
        default: 0,
        min: [0, 'Stock cannot be negative'],
    },
    expiryDate: {
        type: Date,
        default: null,
    },
    batchNumber: {
        type: String,
        default: '',
        unique: false,
    },
    composition: [
        {
            name: { type: String, default: '' },
            value: { type: String, default: '' },
        }
    ],
    images: [
        { type: String, default: '' }
    ],
    highlights: [
        { type: String, default: '' }
    ],
    relatedProducts: [
        { type: Schema.Types.ObjectId, ref: 'Medicine', default: null }
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