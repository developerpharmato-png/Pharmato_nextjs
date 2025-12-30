import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import RolePermission from '@/models/RolePermission';
import Role from '@/models/Role';

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  await dbConnect();
  const { id } = await context.params;
  if (!id) return NextResponse.json({ success: false, message: 'role id required' }, { status: 400 });
  let perm: any = await RolePermission.findOne({ roleId: id }).lean();
  // Some mongoose typing or runtime environments may return arrays in certain contexts; normalize.
  if (Array.isArray(perm)) perm = perm[0];
  const menuItems = [
    'Dashboard','Medicines','Categories','Subcategories',
    'Orders','Customers','Stores','Banner Images',
    'Product Analytics','Order Analytics',
    'Setting','Privacy Policies','Term & Condition',
    'Role','Permission','Management'
  ];

  if (!perm) {
    const permissions: Record<string, any> = {};
    menuItems.forEach(name => { permissions[name] = { view: true, edit: true }; });
    // If role is SuperAdmin, return all-true and ensure DB has it
    try {
      const roleDoc: any = await Role.findById(id).lean();
      if (roleDoc && roleDoc.name === 'SuperAdmin') {
        // persist explicit all-true permissions for clarity
        await RolePermission.findOneAndUpdate({ roleId: id }, { $set: { permissions } }, { upsert: true });
      }
    } catch {}
    return NextResponse.json({ success: true, data: { permissions } });
  }

  // If doc already has nested permissions, merge them with defaults so all keys are present
  if (perm && (perm.permissions as any) && typeof (perm.permissions as any) === 'object') {
    const saved = (perm.permissions as any) || {};
    const merged: Record<string, { view: boolean; edit: boolean }> = {};
    // Defaults: true/true for each key
    menuItems.forEach((name) => {
      merged[name] = { view: true, edit: true };
    });
    // Override defaults with saved values where present
    Object.keys(saved).forEach((k) => {
      if (menuItems.includes(k)) {
        const entry = saved[k] || {};
        merged[k] = {
          view: Boolean(entry.view ?? merged[k].view),
          edit: Boolean(entry.edit ?? merged[k].edit),
        };
      }
    });

    // If role is SuperAdmin, ensure all keys are true regardless of saved values
    try {
      const roleDoc: any = await Role.findById(id).lean();
      if (roleDoc && roleDoc.name === 'SuperAdmin') {
        menuItems.forEach((m) => { merged[m] = { view: true, edit: true }; });
      }
    } catch {}
    return NextResponse.json({ success: true, data: { permissions: merged } });
  }

  // Helper to coerce string/number variants into boolean
  const toBoolean = (v: any) => {
    if (v === false || v === 0 || v === '0' || v === 'false' || v === 'False' || v === 'FALSE') return false;
    if (v === true || v === 1 || v === '1' || v === 'true' || v === 'True' || v === 'TRUE') return true;
    return Boolean(v);
  };

  // Handle legacy flat fields like isCategoryView / isCategoryEdit
  const legacyPermissions: Record<string, { view: boolean; edit: boolean }> = {};
  let hasLegacy = false;
  menuItems.forEach(menu => {
    const keyBase = menu.replace(/\s+/g, '');
    const viewKey = `is${keyBase}View`;
    const editKey = `is${keyBase}Edit`;
    const v = perm.hasOwnProperty(viewKey) ? toBoolean((perm as any)[viewKey]) : true;
    const e = perm.hasOwnProperty(editKey) ? toBoolean((perm as any)[editKey]) : true;
    if (perm.hasOwnProperty(viewKey) || perm.hasOwnProperty(editKey)) hasLegacy = true;
    legacyPermissions[menu] = { view: v, edit: e };
  });

  if (hasLegacy) {
    // Migrate: set permissions object and unset legacy keys
    const unsetObj: Record<string, ''> = {};
    menuItems.forEach(menu => {
      const keyBase = menu.replace(/\s+/g, '');
      unsetObj[`is${keyBase}View`] = '';
      unsetObj[`is${keyBase}Edit`] = '';
    });
    await RolePermission.findOneAndUpdate(
      { roleId: id },
      { $set: { permissions: legacyPermissions }, $unset: unsetObj },
      { new: true }
    );
    return NextResponse.json({ success: true, data: { permissions: legacyPermissions } });
  }

  // Fallback: return defaults
  const permissions: Record<string, any> = {};
  menuItems.forEach(name => { permissions[name] = { view: true, edit: true }; });
  return NextResponse.json({ success: true, data: { permissions } });
}
