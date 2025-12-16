import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IOrder extends Document {
    userId: mongoose.Types.ObjectId;
    medicineId: Types.ObjectId[];
    payment_mode: string;
    total_order_amount: number;
    actual_amount: number;
    user_total_tax_charged: number;
    razorPay_total_tax_charged: number;
    platform_fee: number;
    discount: number;
    delivery_charges: number;
    coupon_code: string;
    order_id: string;
    invoice_url: string;
    payment_id: string;
    payment_status: string;
    is_order_rated: number;
    order_status: string;
    medicineQuantity: Record<string, any>[];
    calculationData: Record<string, any>;
    paymentHistory: [{}];
    // Prescription fields
    prescription_required: boolean;
    prescription_url: string;
    prescription_status: 'Pending' | 'Approved' | 'Rejected' | 'Re-upload Required';
    prescription_rejection_reason: string;
    prescription_approved_by: mongoose.Types.ObjectId;
    prescription_approved_at: Date;
    prescription_approval_notes: string;
    prescription_rejected_by: mongoose.Types.ObjectId;
    prescription_rejected_at: Date;
    // Delivery address
    delivery_address: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>({
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    medicineId: [{ type: Schema.Types.ObjectId, ref: 'Medicine' }],
    payment_mode: { type: String, default: '' },
    total_order_amount: { type: Number, default: 0 },
    actual_amount: { type: Number, default: 0 },
    user_total_tax_charged: { type: Number, default: 0 },
    razorPay_total_tax_charged: { type: Number, default: 0 },
    platform_fee: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    delivery_charges: { type: Number, default: 0 },
    coupon_code: { type: String, default: '' },
    order_id: { type: String, default: '' },
    invoice_url: { type: String, default: '' },
    payment_id: { type: String, default: '' },
    payment_status: { type: String, default: '' },
    is_order_rated: { type: Number, default: 0 },
    order_status: { type: String, default: '' },
    medicineQuantity: { type: [Object], default: [] },
    calculationData: { type: Object, default: {} },
    paymentHistory: [{ type: Object, default: {} }],
    // Prescription fields
    prescription_required: { type: Boolean, default: false },
    prescription_url: { type: String, default: '' },
    prescription_status: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Re-upload Required'], default: 'Pending' },
    prescription_rejection_reason: { type: String, default: '' },
    prescription_approved_by: { type: Schema.Types.ObjectId, ref: 'Admin' },
    prescription_approved_at: { type: Date },
    prescription_approval_notes: { type: String, default: '' },
    prescription_rejected_by: { type: Schema.Types.ObjectId, ref: 'Admin' },
    prescription_rejected_at: { type: Date },
    // Delivery address
    delivery_address: { type: Object, default: {} },
}, { timestamps: true });

export default mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
