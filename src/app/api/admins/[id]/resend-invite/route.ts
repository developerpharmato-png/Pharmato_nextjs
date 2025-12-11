import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Admin from "@/models/Admin";
import crypto from "crypto";
import { sendEmail } from "@/utils/sendEmail";
import { WELCOME_EMAIL_SUBJECT } from "@/utils/emailSubjects";
import fs from 'fs';
import path from 'path';

async function sendMail(to: string, subject: string, html: string) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || "0");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !port || !user || !pass)
    return { success: false, message: "SMTP not configured" };

  // dynamically import nodemailer only when SMTP is configured
  const nodemailerMod = await import("nodemailer");
  const createTransport = (nodemailerMod &&
    (nodemailerMod.createTransport ||
      nodemailerMod.default?.createTransport)) as any;
  if (!createTransport)
    return { success: false, message: "nodemailer unavailable" };

  const transporter = createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  await transporter.sendMail({ from: user, to, subject, html });
  return { success: true };
}

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


  const templatePath = path.join(process.cwd(), 'src/app/api/admin/html-templates/inviteEmailTemplate.html');
  let html = '';
  try {
    html = fs.readFileSync(templatePath, 'utf8').replace(/{{inviteUrl}}/g, inviteUrl);
  } catch (err) {
      }

  // try to send mail if SMTP configured
  let sent = false;
  let sendError: string | null = null;
  const mailRes = await sendEmail({
    to: admin.email,
    subject: WELCOME_EMAIL_SUBJECT,
    html,
  });
  if (mailRes.success) sent = true;
  else sendError = mailRes.message || 'Failed to send';

  return NextResponse.json({
    success: true,
    message: 'Please check your email to set your password.',
    data: { inviteUrl, sent, sendError }
  });
}
