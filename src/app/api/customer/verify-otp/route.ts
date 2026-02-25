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
 *               isNewUser:
 *                 type: boolean
 *                 example: false
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
import fs from 'fs';
import path from 'path';
import { sendPushNotificationWithData } from '@/utils/firebase.helper';
import Admin from '@/models/Admin';
import Notification from '@/models/Notification';

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


    // Choose template based on create or update
    const headerPath = path.join(process.cwd(), 'src/app/api/admin/html-templates/emailHeader.html');
    const footerPath = path.join(process.cwd(), 'src/app/api/admin/html-templates/emailFooter.html');
    const header = fs.readFileSync(headerPath, 'utf8');
    const footer = fs.readFileSync(footerPath, 'utf8');

    // =====================================
    // 5️⃣ New User → Create Welcome Notification
    // =====================================
    if (user.isNewUser) {
        try {
            const Notification = (await import('@/models/Notification')).default;
            await Notification.create({
                userId: user._id.toString(),
                role: 'customer',
                title: 'Welcome to Pharmato!',
                message: '“Welcome to Pharmato: Your health essentials are just a tap away!”',
                type: 'welcome',
                targetScreen: 'account',
                targetId: user._id.toString(),
                isRead: false,
                createdAt: new Date(),
            });
        } catch (err) {
            console.error('Failed to create welcome notification:', err);
        }

        // Send push notification to customer if deviceToken exists
        if (user && (user as any).deviceToken) {
            try {
                await sendPushNotificationWithData({
                    token: (user as any).deviceToken,
                    title: 'Pharmato',
                    body: "“Welcome to Pharmato: Your health essentials are just a tap away!”",
                    data: {
                        targetId: user._id.toString(),
                        type: 'welcome',
                        targetScreen: 'account',
                    }
                });
            } catch (err) {
                console.error('Failed to send push notification:', err);
            }
        }

        // Send welcome email if user has email
        if (user.email) {
            try {
                const { sendEmail } = await import('@/utils/sendEmail');
                const { WELCOME_EMAIL_SUBJECT } = await import('@/utils/emailSubjects');
                const name = user.name || '';
                const displayName = name ? name : (user.mobile || 'Customer');
                const html = `
                ${header}
                    <div style="font-family: Arial, sans-serif; color: #333; line-height:1.5;">
                      <p>Hello ${displayName},</p>
                      <p>Welcome to "Pharmato"! 👋<br/>We’re glad to have you with us.</p>
                      <p>Pharmato makes ordering medicines and healthcare essentials simple, safe, and convenient. Upload your doctor’s prescription, place your order, and let us take care of the rest—right from verified pharmacies to your doorstep.</p>
                      <p>With Pharmato, you can:</p>
                      <ul>
                        <li>Order medicines easily</li>
                        <li>Upload and manage prescriptions securely</li>
                        <li>Get medicines delivered to your home</li>
                        <li>Track your orders in real time</li>
                      </ul>
                      <p>Start exploring now and experience hassle-free healthcare delivery.</p>
                      <p>Stay healthy,<br/>Team Pharmato<br/>Your trusted pharmacy partner</p>
                    </div>
                    ${footer}
                `;

                await sendEmail({
                    to: user.email,
                    subject: WELCOME_EMAIL_SUBJECT,
                    html
                });
            } catch (err) {
                console.error('Failed to send welcome email:', err);
            }
        }

        // Notify all superadmins
        try {
            const superAdminRole = await (await import('@/models/Role')).default.findOne({ name: /superadmin/i });
            if (superAdminRole && superAdminRole._id) {
                const superAdmins = await Admin.find({ roleId: superAdminRole._id }).lean();
                for (const superAdmin of superAdmins) {

                    await Notification.create({
                        userId: user._id.toString(),
                        role: 'admin',
                        title: 'Welcome to Pharmato!',
                        message: `New User Registered: ${user.name || 'Customer'} has joined Pharmato using ${user.mobile}.`,
                        type: 'welcome',
                        targetScreen: 'customer/detail',
                        targetId: user._id.toString(),
                        isRead: false,
                        createdAt: new Date(),
                    });

                    try {
                        const superToken = (superAdmin as any).deviceToken;
                        if (superToken) {
                            await sendPushNotificationWithData({
                                token: superToken,
                                title: 'Pharmato',
                                body: `New User Registered: ${user.name || 'Customer'} has joined Pharmato using ${user.mobile}.`,
                                data: {
                                    targetId: user._id.toString(),
                                    type: 'welcome',
                                    targetScreen: 'customer/detail',
                                }
                            });
                        }
                    } catch (err) {
                        console.error('Failed to send push notification to superadmin:', err);
                    }

                }
            }
        } catch (err) {
            console.error('Superadmin notification error:', err);
        }

    }

    return NextResponse.json({ success: true, message: 'Login successful', user, accessToken, refreshToken });
}
