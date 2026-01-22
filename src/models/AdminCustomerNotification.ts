import mongoose, { Schema, Document } from 'mongoose';

export interface IAdminCustomerNotification extends Document {
    uniqueCode: string;
    title: string;
    message: string;
    recipients: string[];
    status: string;
    sentCount: number;
    failedCount: number;
}

const AdminCustomerNotificationSchema: Schema = new Schema({
    uniqueCode: { type: String },
    title: { type: String },
    message: { type: String },
    recipients: [{ type: String, default: '' }],
    status: { type: String },
    sentCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
}, { timestamps: true });


// Auto-increment uniqueCode on new category creation
AdminCustomerNotificationSchema.pre('validate', async function (next) {
    if (this.isNew && !this.uniqueCode) {
        const AdminCustomerNotification = mongoose.models.AdminCustomerNotification || mongoose.model<IAdminCustomerNotification>('AdminCustomerNotification', AdminCustomerNotificationSchema);
        const count = await AdminCustomerNotification.countDocuments();
        this.uniqueCode = `CAT-${count + 1}`;
    }
    next();
});

export default mongoose.model<IAdminCustomerNotification>('AdminCustomerNotification', AdminCustomerNotificationSchema);
