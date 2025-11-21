import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/models/Admin';
import crypto from 'crypto';

// In-memory store for demo purposes
const resetTokens: Record<string, { email: string; expires: number }> = {};

export async function POST(request: NextRequest) {
    await connectDB();
    const { email } = await request.json();
    if (!email) {
        return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }
    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
        // For security, always return success
        return NextResponse.json({ success: true });
    }
    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    resetTokens[token] = {
        email: admin.email,
        expires: Date.now() + 1000 * 60 * 15 // 15 minutes
    };
    // Simulate sending email (return token in response for demo)
    return NextResponse.json({ success: true, token });
}

export function getResetTokenStore() {
    return resetTokens;
}
