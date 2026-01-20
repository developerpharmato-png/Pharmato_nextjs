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
 *               userId:
 *                 type: string
 *                 example: "USER_OBJECT_ID"
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
    // Log deviceToken if sent in headers (case-insensitive key)
    try {
        const headerDeviceToken = request.headers.get('devicetoken') || request.headers.get('deviceToken') || request.headers.get('device-token');
        console.log('verify-otp: deviceToken (body):', deviceToken);
        console.log('verify-otp: deviceToken (header):', headerDeviceToken);
    } catch (e) {
        console.log('verify-otp: failed to read headers for deviceToken', e);
    }
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
            user.userBlockedTime = new Date(now.getTime() + 15 * 60 * 1000); // Block 15 min
        }
        await user.save();
        return NextResponse.json({ success: false, error: 'Invalid or expired OTP' }, { status: 400 });
    }
    user.isVerified = true;
    user.isActive = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    user.incorrectOtpAttempt = 0;
    user.isBlocked = 0;
    user.userBlockedTime = undefined;
    if (deviceToken) {

         const checkDeviceToken = await User.find({ deviceToken: deviceToken });

         if (checkDeviceToken && checkDeviceToken.length > 0) {
            for (const element of checkDeviceToken) {

                element.deviceToken = "";
                await element.save();
                
            }
         }

        user.deviceToken = deviceToken;
    } else {
        user.deviceToken = undefined;
    }
    // Issue access and refresh tokens
    const accessToken = signJwt({ userId: user._id, mobile: user.mobile, role: 'customer' }, '24h');
    const refreshToken = signJwt({ userId: user._id, mobile: user.mobile, role: 'customer' }, undefined); // default: no expiry
    user.refreshToken = refreshToken;
    await user.save();
    return NextResponse.json({ success: true, message: 'Login successful', user, accessToken, refreshToken });
}
