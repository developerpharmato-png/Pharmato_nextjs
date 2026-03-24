import mongoose from 'mongoose';
const { Schema } = mongoose;

/* ---------------- DISCOUNT UTILITY ---------------- */
function calculateDiscount(mrp?: number, price?: number) {
    if (typeof mrp === 'number' && typeof price === 'number' && mrp > 0) {
        let discount = Math.round(((mrp - price) / mrp) * 100);
        if (discount < 0) discount = 0;
        if (discount > 100) discount = 100;
        return discount;
    }
    return 0;
}

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
    unitPackFactor: number;
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
    previousMargData?: any;
}

const MedicineSchema = new Schema<IMedicine>({
    margData: {
        type: Schema.Types.Mixed,
        default: {},
    },
    previousMargData: {
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
        // default: null,
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
    discount: { type: Number, default: 0 },
    stock: {
        type: Number,
        default: 0,
        min: [0, 'Stock cannot be negative'],
    },
    unitPackFactor: {
        type: Number,
        default: 0,
        min: [0, 'Unit pack factor cannot be negative'],
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


/* ---------------- SAVE (INSERT / DOC SAVE) ---------------- */
MedicineSchema.pre('save', async function (next) {
    this.discount = calculateDiscount(this.mrp, this.price);

    if (this.isNew && !this.uniqueCode) {
        const Medicine = mongoose.models.Medicine || mongoose.model('Medicine', MedicineSchema);
        const count = await Medicine.countDocuments();
        this.uniqueCode = `MED-${count + 1}`;
    }

    next();
});

/* ---------------- UPDATE (findOneAndUpdate) ---------------- */
MedicineSchema.pre('findOneAndUpdate', function (next) {
    const update: any = this.getUpdate();

    const mrp = update.mrp ?? update.$set?.mrp;
    const price = update.price ?? update.$set?.price;

    if (mrp !== undefined || price !== undefined) {
        if (!update.$set) update.$set = {};
        update.$set.discount = calculateDiscount(mrp, price);
    }

    next();
});

/* ---------------- BULK UPDATE ---------------- */
MedicineSchema.pre(['updateOne', 'updateMany'], function (next) {
    const update: any = this.getUpdate();

    const mrp = update.mrp ?? update.$set?.mrp;
    const price = update.price ?? update.$set?.price;

    if (mrp !== undefined || price !== undefined) {
        if (!update.$set) update.$set = {};
        update.$set.discount = calculateDiscount(mrp, price);
    }

    next();
});

export default mongoose.models.Medicine || mongoose.model<IMedicine>('Medicine', MedicineSchema);