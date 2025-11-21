/**
 * @swagger
 * /api/customer/resend-otp:
 *   post:
 *     summary: Resend OTP to user by object id
 *     tags:
 *       - Customer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "USER_OBJECT_ID"
 *     responses:
 *       200:
 *         description: OTP resent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 otp:
 *                   type: string
 *       404:
 *         description: User not found
 *       429:
 *         description: Too many OTP requests
 */
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
    await connectDB();
    const { userId } = await request.json();
    if (!userId) {
        return NextResponse.json({ success: false, error: 'User object id required' }, { status: 400 });
    }
    let user = await User.findById(userId);
    if (!user) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    // OTP request limit (max 5 per hour)
    const now: any = new Date();
    if (user.otpCount && user.otpCount >= 5 && user.otpGenerateTime && (now - user.otpGenerateTime) < 60 * 60 * 1000) {
        return NextResponse.json({ success: false, error: 'Too many OTP requests. Try again later.' }, { status: 429 });
    }
    const otp = generateOTP();
    user.otp = otp;
    user.otpGenerateTime = now;
    user.otpCount = (user.otpCount || 0) + 1;
    user.incorrectOtpAttempt = 0;
    user.isBlocked = 0;
    await user.save();
    // TODO: Integrate SMS gateway here
    return NextResponse.json({ success: true, message: 'OTP resent', otp, userId: user._id }); // For dev, return OTP and userId
}
