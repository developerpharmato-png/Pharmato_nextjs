
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISetting extends Document {
    data: string;
    data_value_in: string;
    type: string;
    description: string;
    is_active: number;
    is_admin_list: number;
    createdAt?: Date;
    updatedAt?: Date;
}

const SettingSchema: Schema<ISetting> = new Schema(
    {
        data: { type: String, default: '' },
        data_value_in: { type: String, default: '' },
        type: { type: String, default: '' },
        description: { type: String, default: '' },
        is_active: { type: Number, default: 1 },
        is_admin_list: { type: Number, default: 0 },
    },
    {
        timestamps: true,
    }
);

const Setting: Model<ISetting> = mongoose.models.Setting || mongoose.model<ISetting>('Setting', SettingSchema);

export default Setting;
