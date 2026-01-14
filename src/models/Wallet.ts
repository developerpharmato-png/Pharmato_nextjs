import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IWallet extends Document {
    userId: Types.ObjectId;
    payment_mode: string;
    amount: number;
    totalAmount: number;
    razorPay_total_tax_charged: number;
    recharge_id: string;
    recharge_status: string;
    payment_id: string;
    payment_status: string;
    wallet_transaction_type: string;
    paymentHistory: object[];
    createdAt?: Date;
    updatedAt?: Date;
}

const WalletSchema: Schema<IWallet> = new Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        payment_mode: { type: String, default: '' },
        amount: { type: Number, default: 0 },
        totalAmount: { type: Number, default: 0 },
        razorPay_total_tax_charged: { type: Number, default: 0 },
        recharge_id: { type: String, default: '' },
        recharge_status: { type: String, default: '' },
        payment_id: { type: String, default: '' },
        payment_status: { type: String, default: '' },
        wallet_transaction_type: { type: String, default: '' },
        paymentHistory: { type: [Object], default: [] },
    },
    {
        timestamps: true,
    }
);

const Wallet: Model<IWallet> = mongoose.models.Wallet || mongoose.model<IWallet>('Wallet', WalletSchema);

export default Wallet;
