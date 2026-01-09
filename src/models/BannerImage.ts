import mongoose, { Schema, Document } from "mongoose";

export interface IBannerImage extends Document {
  images: any[];
  bannerFor: string;
}

const AnyObjectSchema = new Schema(
  {},
  {
    _id: true,      // <-- force mongoose to generate _id for each object
    strict: false   // <-- allow ANY key/value inside object
  }
);

const BannerImageSchema = new Schema(
  {
    images: { type: [AnyObjectSchema], default: [] },
    bannerFor: { type: String, default: '' }
  },
  { timestamps: true }
);

export default mongoose.models.BannerImage ||
  mongoose.model<IBannerImage>("BannerImage", BannerImageSchema);
