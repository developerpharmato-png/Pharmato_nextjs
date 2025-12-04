import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
    userId: string;
    role: 'admin' | 'customer';
    title: string;
    message: string;
    type?: string;
    targetScreen?: string;
    targetId?: string;
    isRead: boolean;
    createdAt: Date;
    readAt?: Date;
    meta?: any;
}

const NotificationSchema = new Schema<INotification>({
    userId: { type: String, default: '' },
    role: { type: String, enum: ['admin', 'customer'], default: 'customer' },
    title: { type: String, default: '' },
    message: { type: String, default: '' },
    type: { type: String, default: '' },
    targetScreen: { type: String, default: '' },
    targetId: { type: String, default: '' },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    readAt: { type: Date, default: null },
    meta: { type: Schema.Types.Mixed, default: {} },
});

export default mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
