import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Admin from '@/models/Admin';

// POST /api/admins/verify-token
export async function POST(req: NextRequest) {
  await dbConnect();
  const { token } = await req.json();
  if (!token) {
    return NextResponse.json({ success: false, message: 'Token is required' }, { status: 400 });
  }

  const admin = await Admin.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: new Date() } });
  if (!admin) {
    return NextResponse.json({ success: false, message: 'Invalid or expired token' }, { status: 400 });
  }

  return NextResponse.json({ success: true, message: 'Token is valid' });
}
