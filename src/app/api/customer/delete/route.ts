import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

/**
 * @swagger
 * /api/customer/delete:
 *   post:
 *     summary: Delete customer account (erase all user data)
 *     tags:
 *       - Customer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 example: "652e1a2b3c4d5e6f7a8b9c0d"
 *     responses:
 *       200:
 *         description: Account deleted
 *       404:
 *         description: User not found
 */
export async function POST(request: NextRequest) {
    await connectDB();
    const { id } = await request.json();
    if (!id) {
        return NextResponse.json({ success: false, error: 'User id required' }, { status: 400 });
    }
    const user = await User.findById(id);
    if (!user) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    // Erase all fields except _id
    const emptyFields = {
        name: '',
        mobile: '',
        countryCode: '',
        email: '',
        otp: '',
        otpExpires: null,
        refreshToken: '',
        deviceToken: '',
        socialProvider: '',
        socialId: '',
        isVerified: false,
        isActive: false,
        isDelete: true,
        walletAmount: 0,
        incorrectOtpAttempt: 0,
        otpCount: 0,
        otpGenerateTime: null,
        isBlocked: false,
        userBlockedTime: null,
    };
    Object.assign(user, emptyFields);
    await user.save();
    return NextResponse.json({ success: true, message: 'Account Deletion Successful.' }, { status: 200 });
}
