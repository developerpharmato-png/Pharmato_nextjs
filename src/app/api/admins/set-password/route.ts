import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Admin from '@/models/Admin';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  await dbConnect();
  const body = await req.json();
  const { token, password } = body;
  if (!token || !password) return NextResponse.json({ success: false, message: 'token and password required' }, { status: 400 });

  const admin = await Admin.findOne({ resetPasswordToken: token });
  if (!admin) return NextResponse.json({ success: false, message: 'Invalid or expired token' }, { status: 400 });
  if (!admin.resetPasswordExpires || admin.resetPasswordExpires < new Date()) {
    return NextResponse.json({ success: false, message: 'Token expired' }, { status: 400 });
  }

  const hashed = await bcrypt.hash(password, 10);
  admin.password = hashed as any;
  admin.resetPasswordToken = null as any;
  admin.resetPasswordExpires = null as any;
  await admin.save();

  return NextResponse.json({ success: true, message: 'Password set successfully' });
}
