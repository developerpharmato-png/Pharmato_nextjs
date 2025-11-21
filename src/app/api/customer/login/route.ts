/**
 * @swagger
 * /api/customer/login:
 *   post:
 *     summary: Login with mobile number (send OTP)
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
 *               countryCode:
 *                 type: string
 *                 example: "+91"
 *     responses:
 *       200:
 *         description: OTP sent successfully
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
 *       403:
 *         description: User is blocked
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
    const { mobile, countryCode } = await request.json();
    if (!mobile) {
        return NextResponse.json({ success: false, error: 'Mobile number required' }, { status: 400 });
    }
    // Find user or create new
    let user = await User.findOne({ mobile });
    const now = new Date();
    // Blocked user check
    if (user && user.isBlocked && user.userBlockedTime && user.userBlockedTime > now) {
        return NextResponse.json({ success: false, error: 'User is blocked. Try later.' }, { status: 403 });
    }
    // OTP request limit (example: max 5 per hour)
    if (user && user.otpCount && user.otpCount >= 5 && user.otpGenerateTime && (now.getTime() - new Date(user.otpGenerateTime).getTime()) < 60 * 60 * 1000) {
        return NextResponse.json({ success: false, error: 'Too many OTP requests. Try again later.' }, { status: 429 });
    }
    const otp = generateOTP();
    const otpExpires = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes from now
    if (!user) {
        user = await User.create({
            mobile,
            countryCode,
            otp,
            otpGenerateTime: now,
            otpExpires,
            incorrectOtpAttempt: 0,
            otpCount: 1,
            isBlocked: 0,
            isActive: 0,
        });
    } else {
        user.otp = otp;
        user.otpGenerateTime = now;
        user.otpExpires = otpExpires;
        user.incorrectOtpAttempt = 0;
        user.otpCount = (user.otpCount || 0) + 1;
        user.isBlocked = 0;
        user.isActive = 0;
        await user.save();
    }
    // TODO: Integrate SMS gateway here
    return NextResponse.json({ success: true, message: 'OTP sent', otp, userId: user._id }); // For dev, return OTP and userId
}
