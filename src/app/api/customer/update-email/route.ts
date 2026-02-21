import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import dbConnect from '@/lib/mongodb';
import { sendPushNotificationWithData } from '@/utils/firebase.helper';

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
    const oldEmail = user.email;
    if (user.otp !== otp || !user.otpExpires || user.otpExpires < new Date()) {
        return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
    }
    user.email = email;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    // Send notification if deviceToken exists
    if (user.deviceToken) {
        try {
            await sendPushNotificationWithData({
                token: user.deviceToken,
                title: 'Pharmato',
                body: `Email Address updated successfully.`,
                data: {
                    type: 'email-update',
                    targetScreen: 'account',
                    targetId: user._id.toString(),
                    userId: user._id.toString(),
                    oldEmail: oldEmail,
                    newEmail: email
                }
            });
        } catch (err) {
            console.error('Failed to send notification:', err);
        }
    }

    // Create in-app notification
    try {
        const Notification = (await import('@/models/Notification')).default;
        await Notification.create({
            userId: user._id.toString(),
            role: 'customer',
            title: 'Email Updated',
            message: `Email Address updated successfully.`,
            type: 'email-update',
            targetScreen: 'account',
            targetId: user._id.toString(),
            meta: { oldEmail: user.email, newEmail: email },
            isRead: false,
            createdAt: new Date(),
        });
    } catch (err) {
        console.error('Failed to create email update notification:', err);
    }

    return NextResponse.json({ success: true, message: 'Email Updated Successfully.' });
}
