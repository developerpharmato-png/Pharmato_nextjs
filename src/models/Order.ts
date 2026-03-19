import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IOrder extends Document {
    userId: mongoose.Types.ObjectId;
    storeId: mongoose.Types.ObjectId;
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
    refundHistory: [{}];
    isPrescriptionRequired?: boolean;
    prescription_url: string[];
    reject_prescription_url: [{}];
    prescription_status: string;
    prescription_rejection_reason?: string;
    prescription_rejected_by?: mongoose.Types.ObjectId;
    prescription_rejected_at?: Date;
    prescription_approval_notes?: string;
    prescription_approved_by?: mongoose.Types.ObjectId;
    prescription_approved_at?: Date;
    deliveredAddress?: Record<string, any>;
    expectedDeliveryDate?: Date;
    deliveredDate?: Date;
    refunds: Record<string, any>[];
    margOrderNo: string;
    margOrderInsertData: Record<string, any>;
    margOrderDispatchData: Record<string, any>;
    privacyPolicy: string;
    termAndCondition: string;
    returnAndRefundPolicy: string;
    otherPolicy: string;
    createdAt: Date;
    updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>({
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    storeId: { type: Schema.Types.ObjectId, ref: 'Store' },
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
    refundHistory: [{ type: Object, default: {} }],
    isPrescriptionRequired: { type: Boolean, default: false }, 
    prescription_url: [
        { type: String, default: '' }
    ],
    reject_prescription_url: [{ type: Object, default: {} }],
    prescription_status: { type: String, default: '' },
    prescription_rejection_reason: { type: String, default: '' },
    prescription_rejected_by: { type: Schema.Types.ObjectId, ref: 'Admin', default: null },
    prescription_rejected_at: { type: Date },
    prescription_approval_notes: { type: String, default: '' },
    prescription_approved_by: { type: Schema.Types.ObjectId, ref: 'Admin', default: null },
    prescription_approved_at: { type: Date },
    deliveredAddress: { type: Object, default: {} },
    expectedDeliveryDate: { type: Date },
    deliveredDate: { type: Date },
    refunds: { type: [Object], default: [] },
    margOrderNo: { type: String, default: '' },
    margOrderInsertData: { type: Object, default: {} },
    margOrderDispatchData: { type: Object, default: {} },
    privacyPolicy: { type: String, default: '' },
    termAndCondition: { type: String, default: '' },
    returnAndRefundPolicy: { type: String, default: '' },
    otherPolicy: { type: String, default: '' },
}, { timestamps: true });


export default mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema); 