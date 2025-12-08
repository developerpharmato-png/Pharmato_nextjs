import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Admin from '@/models/Admin';
import crypto from 'crypto';

async function sendMail(to: string, subject: string, html: string) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || '0');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !port || !user || !pass) return { success: false, message: 'SMTP not configured' };

  // dynamically import nodemailer only when SMTP is configured
  const nodemailerMod = await import('nodemailer');
  const createTransport = (nodemailerMod && (nodemailerMod.createTransport || nodemailerMod.default?.createTransport)) as any;
  if (!createTransport) return { success: false, message: 'nodemailer unavailable' };

  const transporter = createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  await transporter.sendMail({ from: user, to, subject, html });
  return { success: true };
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  const { id } = await params;
  if (!id) return NextResponse.json({ success: false, message: 'id required' }, { status: 400 });

  const admin = await Admin.findById(id);
  if (!admin) return NextResponse.json({ success: false, message: 'Admin not found' }, { status: 404 });

  // generate token
  const token = crypto.randomBytes(20).toString('hex');
  const expires = new Date(Date.now() + 15 * 60 * 1000);

  admin.resetPasswordToken = token;
  admin.resetPasswordExpires = expires;
  await admin.save();

  const base = process.env.NEXT_PUBLIC_BASE_URL || '';
  const inviteUrl = `${base}/set-Password/${token}`;

  // try to send mail if SMTP configured
  let sent = false;
  let sendError: string | null = null;
  try {
    const mailRes = await sendMail(
      admin.email,
      'Set your admin password',
      `<p>Hello ${admin.name || ''},</p><p>Please set your password using the following link (valid for 15 minutes):</p><p><a href="${inviteUrl}">${inviteUrl}</a></p>`
    );
    if (mailRes.success) sent = true;
    else sendError = mailRes.message || 'Failed to send';
  } catch (e: any) {
    sendError = e?.message || String(e);
  }

  return NextResponse.json({ success: true, message: 'Reset token created', data: { inviteUrl, sent, sendError } });
}
