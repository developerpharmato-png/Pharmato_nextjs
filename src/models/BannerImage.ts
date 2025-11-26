import mongoose, { Schema, Document } from 'mongoose';

export interface IBannerImage extends Document {
    images: string[];
}

const BannerImageSchema: Schema = new Schema({
    images: { type: [String], required: true, default: [] },
}, { timestamps: true });

export default mongoose.models.BannerImage || mongoose.model<IBannerImage>('BannerImage', BannerImageSchema);
