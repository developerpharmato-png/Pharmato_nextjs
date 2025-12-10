import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import dbConnect from '@/lib/mongodb';

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * @swagger
 * /api/customer/send-otp-mobile:
 *   post:
 *     summary: Send OTP for mobile update
 *     tags:
 *       - Customer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - mobile
 *               - countryCode
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "656e1234abcd5678efgh9012"
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
 *       404:
 *         description: User not found
 */
export async function POST(req: NextRequest) {
    await dbConnect();
    const { userId, mobile, countryCode } = await req.json();
    if (!userId || !mobile || !countryCode) {
        return NextResponse.json({ success: false, error: 'userId, mobile, and countryCode required' }, { status: 400 });
    }
    const user = await User.findById(userId);
    if (!user) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    // user.mobile = mobile;
    // user.countryCode = countryCode;
    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 min expiry
    await user.save();
    // TODO: Integrate SMS gateway here to send OTP to new mobile
    return NextResponse.json({ success: true, message: 'OTP Sent Successfully.', otp }); // For dev, return OTP
}
