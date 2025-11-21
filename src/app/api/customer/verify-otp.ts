/**
 * @swagger
 * /api/customer/verify-otp:
 *   post:
 *     summary: Verify OTP and login
 *     tags:
 *       - Customer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mobile:
 *                 type: string
 *                 example: "9876543210"
 *               otp:
 *                 type: string
 *                 example: "123456"
 *               deviceToken:
 *                 type: string
 *                 example: "device_token_123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *       400:
 *         description: Invalid or expired OTP
 *       403:
 *         description: User is blocked
 */
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { signJwt } from '@/lib/jwt';

export async function POST(request: NextRequest) {
    await connectDB();
    const { userId, otp, deviceToken } = await request.json();
    if (!userId || !otp) {
        return NextResponse.json({ success: false, error: 'User object id and OTP required' }, { status: 400 });
    }
    const user = await User.findById(userId);
    if (!user) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    // Check OTP expiry (5 min)
    const now = new Date();
    if (!user.otp || user.otp !== otp || !user.otpExpires || user.otpExpires < now) {
        user.incorrectOtpAttempt = (user.incorrectOtpAttempt || 0) + 1;
        if (user.incorrectOtpAttempt >= 5) {
            user.isBlocked = 1;
            user.userBlockedTime = new Date(now.getTime() + 30 * 60 * 1000); // Block 30 min
        }
        await user.save();
        return NextResponse.json({ success: false, error: 'Invalid or expired OTP' }, { status: 400 });
    }
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    user.incorrectOtpAttempt = 0;
    user.isBlocked = 0;
    user.userBlockedTime = undefined;
    if (deviceToken) user.deviceToken = deviceToken;
    await user.save();
    // Issue JWT token
    const token = signJwt({ userId: user._id, mobile: user.mobile });
    return NextResponse.json({ success: true, message: 'Login successful', user, token });
}
