import mongoose, { Document, Schema } from 'mongoose';

export interface IRole extends Document {
  name: string;
  permissions: string[];
  isActive: boolean;
  uniqueCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RoleSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    permissions: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    uniqueCode: { type: String },
  },
  { timestamps: true }
);

const Role = mongoose.models.Role || mongoose.model<IRole>('Role', RoleSchema);
export default Role;
