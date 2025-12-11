import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import RolePermission from '@/models/RolePermission';
import Admin from '@/models/Admin';
import crypto from 'crypto';

// POST - upsert role permission
export async function POST(req: NextRequest) {
  await dbConnect();
  const body = await req.json();
  const { roleId } = body;
  if (!roleId) return NextResponse.json({ success: false, message: 'roleId is required' }, { status: 400 });
  // If client passed nested permissions object, use it.
  let permissions: Record<string, { view: boolean; edit: boolean }> = {};

  const toBoolean = (v: any) => {
    if (v === false || v === 0 || v === '0' || v === 'false' || v === 'False' || v === 'FALSE') return false;
    if (v === true || v === 1 || v === '1' || v === 'true' || v === 'True' || v === 'TRUE') return true;
    return Boolean(v);
  };

  if (body.permissions && typeof body.permissions === 'object') {
    // Normalize nested permissions values to booleans
    Object.keys(body.permissions).forEach((menu) => {
      const entry = body.permissions[menu] || {};
      permissions[menu] = {
        view: entry.hasOwnProperty('view') ? toBoolean(entry.view) : true,
        edit: entry.hasOwnProperty('edit') ? toBoolean(entry.edit) : true,
      };
    });
  } else {
    // Try to map flat keys like isCategoryView / isCategoryEdit to menu-based permissions
    const menuItems = ['Dashboard','Medicines','Categories','Subcategories','Prescriptions','Admins','Customers','Pincodes','Stores','Banner Images'];
    menuItems.forEach(menu => {
      const keyBase = menu.replace(/\s+/g, '');
      const viewKey = `is${keyBase}View`;
      const editKey = `is${keyBase}Edit`;
      const v = body.hasOwnProperty(viewKey) ? toBoolean(body[viewKey]) : true;
      const e = body.hasOwnProperty(editKey) ? toBoolean(body[editKey]) : true;
      permissions[menu] = { view: v, edit: e };
    });
  }


  await RolePermission.findOneAndUpdate(
    { roleId },
    { $set: { permissions } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Invalidate all admin sessions for this role
  await Admin.updateMany(
    { roleId },
    { $set: { sessionToken: crypto.randomBytes(32).toString('hex') } }
  );

  // Ensure legacy flat keys are removed if present
  const menuItems = ['Dashboard','Medicines','Categories','Subcategories','Prescriptions','Admins','Customers','Pincodes','Stores','Banner Images'];
  const unsetObj: Record<string, ''> = {};
  let hadLegacy = false;
  // Check the stored document for legacy fields and prepare unset
  const stored = await RolePermission.findOne({ roleId }).lean();
  if (stored) {
    menuItems.forEach(menu => {
      const keyBase = menu.replace(/\s+/g, '');
      const viewKey = `is${keyBase}View`;
      const editKey = `is${keyBase}Edit`;
      if ((stored as any).hasOwnProperty(viewKey)) { unsetObj[viewKey] = ''; hadLegacy = true; }
      if ((stored as any).hasOwnProperty(editKey)) { unsetObj[editKey] = ''; hadLegacy = true; }
    });
    if (hadLegacy) {
      await RolePermission.findOneAndUpdate({ roleId }, { $unset: unsetObj });
    }
  }

  // Return the saved permissions from DB to avoid mismatch
  let saved: any = await RolePermission.findOne({ roleId }).lean();
  if (Array.isArray(saved)) saved = saved[0];

  // If caller passed ?debug=1, include raw body and normalized permissions for troubleshooting
  try {
    const url = new URL(req.url);
    if (url.searchParams.get('debug') === '1') {
      const savedPerms = saved && (saved as any).permissions ? (saved as any).permissions : permissions;
      return NextResponse.json({ success: true, message: 'Permissions saved (debug)', received: body, normalized: permissions, saved: savedPerms });
    }
  } catch (e) {
    // ignore URL parsing errors
  }

  const savedPermissions = saved && (saved as any).permissions ? (saved as any).permissions : permissions;
  return NextResponse.json({ success: true, message: 'Permissions saved', data: { roleId, permissions: savedPermissions } });
}
