import mongoose, { Schema, Document } from 'mongoose';



export interface IBannerImage extends Document {
    images: Record<string, any>[];
}



const BannerImageSchema: Schema = new Schema({
    images: [{ type: Schema.Types.Mixed, default: {} }],
}, { timestamps: true });

export default mongoose.models.BannerImage || mongoose.model<IBannerImage>('BannerImage', BannerImageSchema);
