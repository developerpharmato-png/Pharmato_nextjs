/**
 * @swagger
 * /api/customer/social-login:
 *   post:
 *     summary: Social login (Google, Facebook, etc.)
 *     tags:
 *       - Customer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               provider:
 *                 type: string
 *                 example: "google"
 *               socialId:
 *                 type: string
 *                 example: "1234567890"
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 example: "john@example.com"
 *               deviceToken:
 *                 type: string
 *                 example: "device_token_123"
 *     responses:
 *       200:
 *         description: Social login successful
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
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *       400:
 *         description: Missing provider or socialId
 */
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { signJwt } from '@/lib/jwt';

export async function POST(request: NextRequest) {
    await connectDB();
    const { provider, socialId, name, email, deviceToken } = await request.json();
    if (!provider || !socialId) {
        return NextResponse.json({ success: false, error: 'Provider and socialId required' }, { status: 400 });
    }
    let user = await User.findOne({ socialProvider: provider, socialId });
    if (!user) {
        user = await User.create({ socialProvider: provider, socialId, name, email, isVerified: true, deviceToken });

        // Send welcome notification
        try {
            const Notification = (await import('@/models/Notification')).default;
            await Notification.create({
                userId: user._id.toString(),
                role: 'customer',
                title: 'Welcome to Pharmato!',
                message: 'Thank you for registering. Enjoy your experience!',
                type: 'welcome',
                isRead: false,
                createdAt: new Date(),
            });
        } catch (err) {
            console.error('Failed to create welcome notification:', err);
        }

        // Send welcome email if user has email
        if (user.email) {
            try {
                const { sendEmail } = await import('@/utils/sendEmail');
                const { WELCOME_EMAIL_SUBJECT } = await import('@/utils/emailSubjects');
                await sendEmail({
                    to: user.email,
                    subject: WELCOME_EMAIL_SUBJECT,
                    html: `<h1>Welcome to Pharmato!</h1><p>Thank you for registering. Enjoy your experience!</p>`
                });
            } catch (err) {
                console.error('Failed to send welcome email:', err);
            }
        }

    } else {
        if (deviceToken) {
            user.deviceToken = deviceToken;
        } else {
            user.deviceToken = undefined;
        }
        await user.save();
    }
    // Issue access and refresh tokens
    const accessToken = signJwt({ userId: user._id, mobile: user.mobile, provider, role: 'customer' }, '24h');
    const refreshToken = signJwt({ userId: user._id, mobile: user.mobile, provider, role: 'customer' }, undefined); // default: no expiry
    user.refreshToken = refreshToken;
    await user.save();
    return NextResponse.json({ success: true, message: 'Social login successful', user, accessToken, refreshToken });
}
