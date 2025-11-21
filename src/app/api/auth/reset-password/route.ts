import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/models/Admin';
import bcrypt from 'bcryptjs';
import { getResetTokenStore } from '../forgot-password/route';

export async function POST(request: NextRequest) {
    await connectDB();
    const { token, password } = await request.json();
    if (!token || !password) {
        return NextResponse.json({ success: false, error: 'Token and password are required' }, { status: 400 });
    }
    if (password.length < 6) {
        return NextResponse.json({ success: false, error: 'Password must be at least 6 characters' }, { status: 400 });
    }
    const resetTokens = getResetTokenStore();
    const entry = resetTokens[token];
    if (!entry || entry.expires < Date.now()) {
        return NextResponse.json({ success: false, error: 'Invalid or expired token' }, { status: 400 });
    }
    const admin = await Admin.findOne({ email: entry.email });
    if (!admin) {
        return NextResponse.json({ success: false, error: 'Admin not found' }, { status: 404 });
    }
    admin.password = await bcrypt.hash(password, 10);
    await admin.save();
    delete resetTokens[token];
    return NextResponse.json({ success: true });
}
