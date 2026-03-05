import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Admin from "@/models/Admin";
import crypto from "crypto";
import { sendEmail } from "@/utils/sendEmail";
import { WELCOME_EMAIL_SUBJECT } from "@/utils/emailSubjects";
import fs from 'fs';
import path from 'path';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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



  const headerPath = path.join(process.cwd(), 'src/app/api/admin/html-templates/emailHeader.html');
  const footerPath = path.join(process.cwd(), 'src/app/api/admin/html-templates/emailFooter.html');
  const contentPath = path.join(process.cwd(), 'src/app/api/admin/html-templates/resetPassword.html');
  let html = '';
  try {
    const header = fs.readFileSync(headerPath, 'utf8');
    const content = fs.readFileSync(contentPath, 'utf8').replace(/{{inviteUrl}}/g, inviteUrl);
    const footer = fs.readFileSync(footerPath, 'utf8');
    html = header + content + footer;
  } catch (err) {
    // ignore
  }

  // try to send mail if SMTP configured
  let sent = true;
  let sendError: string | null = null;

  await sendEmail({ to: admin.email, subject: `${WELCOME_EMAIL_SUBJECT}`, html: html });

  return NextResponse.json({
    success: true,
    message: 'Please check your email to set your password.',
    data: { inviteUrl, sent, sendError }
  });
}
