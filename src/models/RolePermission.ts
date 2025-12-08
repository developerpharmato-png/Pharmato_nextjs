import mongoose, { Document, Schema } from 'mongoose';

export interface IRolePermission extends Document {
  roleId: mongoose.Types.ObjectId | string;
  permissions: Record<string, { view: boolean; edit: boolean }>;
  createdAt: Date;
  updatedAt: Date;
}

const RolePermissionSchema: Schema = new Schema(
  {
    roleId: { type: Schema.Types.ObjectId, ref: 'Role', required: true, unique: true },
    // permissions stored as a plain object mapping menuName -> { view, edit }
    permissions: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

const RolePermission = mongoose.models.RolePermission || mongoose.model<IRolePermission>('RolePermission', RolePermissionSchema);
export default RolePermission;
