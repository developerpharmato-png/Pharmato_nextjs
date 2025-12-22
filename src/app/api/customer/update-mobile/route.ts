import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import dbConnect from '@/lib/mongodb';
import { sendPushNotification } from '@/utils/firebase.helper';

/**
 * @swagger
 * /api/customer/update-mobile:
 *   post:
 *     summary: Update customer mobile number (OTP verification required)
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
 *               - otp
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
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Mobile updated successfully
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
    const { userId, mobile, countryCode, otp } = await req.json();
    if (!userId || !mobile || !countryCode || !otp) {
        return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }
    const user = await User.findById(userId);
    if (!user) {
        return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }
    if (user.otp !== otp || !user.otpExpires || user.otpExpires < new Date()) {
        return NextResponse.json({ success: false, message: 'Invalid or expired OTP' }, { status: 400 });
    }
    user.mobile = mobile;
    user.countryCode = countryCode;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    // Send notification if deviceToken exists
    if (user.deviceToken) {
        try {
            await sendPushNotification({
                token: user.deviceToken,
                title: 'Pharmato',
                body: 'Your mobile number has been updated successfully.'
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
            title: 'Mobile Number Updated',
            message: 'Your mobile number has been updated successfully.',
            type: 'mobile-update',
            isRead: false,
            createdAt: new Date(),
        });
    } catch (err) {
        console.error('Failed to create mobile update notification:', err);
    }

    return NextResponse.json({ success: true, message: 'Mobile Number Updated Successfully.' });
}
