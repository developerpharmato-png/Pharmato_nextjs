import mongoose from 'mongoose';
const { Schema } = mongoose;
export interface IMedicine {
    uniqueCode?: string;
    uniqueIdentity: string;
    name: string;
    description: string;
    manufacturer: string;
    medicineType?: string;
    unit?: string;
    category: string;
    categoryId?: mongoose.Types.ObjectId;
    subCategoryId?: mongoose.Types.ObjectId;
    storeId?: mongoose.Types.ObjectId;
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
    coverImage?: string;
    images: string[];
    highlights: string[];
    relatedProducts: mongoose.Types.ObjectId[];
    crossSellProducts: mongoose.Types.ObjectId[];
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
    uniqueCode: {
        type: String
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
    medicineType: {
        type: String,
        default: ''
    },
    unit: {
        type: String,
        default: ''
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
    storeId: {
        type: Schema.Types.ObjectId,
        ref: 'Store',
        default: () => new mongoose.Types.ObjectId('6926e27d3ea929638e7d091c'),
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
        default: ''
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
    coverImage: {
        type: String,
        default: ''
    },
    highlights: [
        { type: String, default: '' }
    ],
    relatedProducts: [
        { type: Schema.Types.ObjectId, ref: 'Medicine', default: null }
    ],
    crossSellProducts: [
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

// Auto-increment uniqueCode on new medicine creation (count-based) before save
MedicineSchema.pre('save', async function (next) {
    // @ts-ignore
    if (this.isNew && !this.uniqueCode) {
        const Medicine = mongoose.models.Medicine || mongoose.model<IMedicine>('Medicine', MedicineSchema);
        const count = await Medicine.countDocuments();
        // @ts-ignore
        this.uniqueCode = `MED-${count + 1}`;
    }
    next();
});

export default mongoose.models.Medicine || mongoose.model<IMedicine>('Medicine', MedicineSchema);