import mongoose, { Schema, Document } from 'mongoose';


export interface IUserOrGuestCouponUsage {
    userId?: mongoose.Types.ObjectId | string;
    guestId?: string;
    uses: number;
}


export interface ICoupon extends Document {
    uniqueCode?: string;
    code: string;
    title: string;
    description: string;
    type: 'percentage' | 'fixed';
    value: number;
    maxDiscountAmount?: number;
    scope: 'global' | 'category' | 'product';
    includedProductIds: string[];
    includedCategoryIds: string[];
    excludedProductIds: string[];
    startAt: Date;
    endAt: Date;
    minOrderValue: number;
    totalUses: number | null;
    usedCount: number;
    perUserLimit: number;
    usersOrGuestsUsed: IUserOrGuestCouponUsage[];
    isActive: boolean;
    isStackable: boolean;
    isSecret: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const CouponSchema = new Schema<ICoupon>({
    uniqueCode: {
        type: String
    },
    code: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    type: { type: String, enum: ['percentage', 'fixed'], required: true },
    value: { type: Number, required: true },
    maxDiscountAmount: { type: Number },
    scope: { type: String, enum: ['global', 'category', 'product'], required: true },
    includedProductIds: [{ type: String }],
    includedCategoryIds: [{ type: String }],
    excludedProductIds: [{ type: String }],
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    minOrderValue: { type: Number, required: true },
    totalUses: { type: Number, default: null },
    usedCount: { type: Number, default: 0 },
    perUserLimit: { type: Number, required: true },
    usersOrGuestsUsed: [
        {
            userId: { type: Schema.Types.ObjectId, ref: 'User' },
            guestId: { type: String },
            uses: { type: Number, default: 0 },
        },
    ],
    isActive: { type: Boolean, default: true },
    isStackable: { type: Boolean, default: false },
    isSecret: { type: Boolean, default: false },
}, {
    timestamps: true,
});

// Auto-increment uniqueCode on new medicine creation (count-based) before save
CouponSchema.pre('save', async function (next) {
    // @ts-ignore
    if (this.isNew && !this.uniqueCode) {
        const Coupon = mongoose.models.Coupon || mongoose.model<ICoupon>('Coupon', CouponSchema);
        const count = await Coupon.countDocuments();
        // @ts-ignore
        this.uniqueCode = `CO-${count + 1}`;
    }
    next();
});

export default mongoose.models.Coupon || mongoose.model<ICoupon>('Coupon', CouponSchema);
