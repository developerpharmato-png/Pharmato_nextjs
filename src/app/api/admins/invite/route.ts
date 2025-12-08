import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Admin from '@/models/Admin';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import Role from '@/models/Role';

// POST /api/admins/invite
export async function POST(req: NextRequest) {
  await dbConnect();
  const body = await req.json();
  const { name, email, roleId } = body;
  if (!email || !name) return NextResponse.json({ success: false, message: 'name and email required' }, { status: 400 });

  const existing = await Admin.findOne({ email: email.toLowerCase() });
  if (existing) {
    // If user exists, still allow re-sending invite by creating token
  }

  // create or update admin with temp password and token
  const token = crypto.randomBytes(20).toString('hex');
  const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  // Ensure role exists
  if (roleId) {
    const r = await Role.findById(roleId);
    if (!r) return NextResponse.json({ success: false, message: 'Invalid role' }, { status: 400 });
  }

  const tempPassword = crypto.randomBytes(8).toString('hex');
  const hashed = await bcrypt.hash(tempPassword, 10);

  const payload: any = {
    name,
    email: email.toLowerCase(),
    password: hashed,
    roleId: roleId || null,
    resetPasswordToken: token,
    resetPasswordExpires: expires,
    isActive: true,
  };

  let upserted: any = await Admin.findOneAndUpdate(
    { email: email.toLowerCase() },
    { $set: payload },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();
  if (Array.isArray(upserted)) upserted = upserted[0];

  // If roleId is present, try to populate role name for convenience
  let roleName: string | null = null;
  if (upserted && (upserted as any).roleId) {
    try {
      const roleDocRaw: any = await Role.findById((upserted as any).roleId).select('name').lean();
      const roleDoc = Array.isArray(roleDocRaw) ? roleDocRaw[0] : roleDocRaw;
      roleName = roleDoc?.name || null;
    } catch (e) {
      // ignore populate errors
    }
  }

  // Create invite URL (development: return in response)
  const base = process.env.NEXT_PUBLIC_BASE_URL || '';
  const inviteUrl = `${base}/set-Password/${token}`;

  // TODO: send email via configured SMTP/service. For now return inviteUrl in response.
  const adminResp: any = { id: upserted?._id, email: upserted?.email };
  // Always include roleId key (string or null) so client can rely on its presence
  adminResp.roleId = (upserted && (upserted as any).roleId) ? String((upserted as any).roleId) : null;
  adminResp.roleName = roleName || null;

  return NextResponse.json({ success: true, message: 'Invite created', data: { inviteUrl, admin: adminResp } });
}
