import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Admin from '@/models/Admin';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import Role from '@/models/Role';
import { sendEmail } from '@/utils/sendEmail';
import { WELCOME_EMAIL_SUBJECT } from '@/utils/emailSubjects';
import fs from 'fs';
import path from 'path';

// POST /api/admins/invite

export async function POST(req: NextRequest) {
  await dbConnect();
  const body = await req.json();
  const { name, email, roleId, _id } = body;
  if (!email || !name) return NextResponse.json({ success: false, message: 'name and email required' }, { status: 400 });

  // create or update admin with temp password and token
  const token = crypto.randomBytes(20).toString('hex');
  const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  // Ensure role exists
  if (roleId) {
    const r = await Role.findById(roleId);
    if (!r) return NextResponse.json({ success: false, message: 'Invalid role' }, { status: 400 });
  }

  let upserted: any = null;
  if (_id) {
    // Update by _id (edit case)
    upserted = await Admin.findByIdAndUpdate(
      _id,
      {
        $set: {
          name,
          email: email.toLowerCase(),
          roleId: roleId || null,
        },
      },
      { new: true }
    ).lean();
  } else {
    // Invite or upsert by email (create case)
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
    upserted = await Admin.findOneAndUpdate(
      { email: email.toLowerCase() },
      { $set: payload },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();
    if (Array.isArray(upserted)) upserted = upserted[0];
  }

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

  // Create invite URL
  const base = process.env.NEXT_PUBLIC_BASE_URL || '';
  const inviteUrl = `${base}/set-Password/${token}`;


  // Choose template based on create or update
  let templateFile = '';
  if (_id) {
    templateFile = 'resetPassword.html';
  } else {
    templateFile = 'firstTimeSetPassword.html';
  }
  const templatePath = path.join(process.cwd(), 'src/app/api/admin/html-templates', templateFile);
  let html = '';
  try {
    html = fs.readFileSync(templatePath, 'utf8').replace(/{{inviteUrl}}/g, inviteUrl);
  } catch (err) {
    // ignore
  }

  // Send email if SMTP configured
  let sent = false;
  let sendError: string | null = null;
  const mailRes = await sendEmail({
    to: upserted?.email,
    subject: WELCOME_EMAIL_SUBJECT,
    html,
  });
  if (mailRes.success) sent = true;
  else sendError = mailRes.message || 'Failed to send';

  const adminResp: any = { id: upserted?._id, email: upserted?.email };
  adminResp.roleId = (upserted && (upserted as any).roleId) ? String((upserted as any).roleId) : null;
  adminResp.roleName = roleName || null;

  return NextResponse.json({
    success: true,
    message: 'Invite created',
    data: { inviteUrl, admin: adminResp, sent, sendError }
  });
}
