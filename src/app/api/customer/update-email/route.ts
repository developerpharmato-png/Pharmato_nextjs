import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import dbConnect from '@/lib/mongodb';

/**
 * @swagger
 * /api/customer/update-email:
 *   post:
 *     summary: Update customer email (OTP verification required)
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
 *               - email
 *               - otp
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "656e1234abcd5678efgh9012"
 *               email:
 *                 type: string
 *                 example: "customer@example.com"
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Email updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid OTP or missing fields
 *       404:
 *         description: User not found
 */
export async function POST(req: NextRequest) {
    await dbConnect();
    const { userId, email, otp } = await req.json();
    if (!userId || !email || !otp) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const user = await User.findById(userId);
    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    if (user.otp !== otp || !user.otpExpires || user.otpExpires < new Date()) {
        return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
    }
    user.email = email;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();
    return NextResponse.json({ success: true, message: 'Email Updated Successfully.' });
}
