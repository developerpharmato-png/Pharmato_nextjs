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
import fs from 'fs';
import path from 'path';
import Cart from '@/models/Cart';

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

        // Choose template based on create or update
        const headerPath = path.join(process.cwd(), 'src/app/api/admin/html-templates/emailHeader.html');
        const footerPath = path.join(process.cwd(), 'src/app/api/admin/html-templates/emailFooter.html');
        const header = fs.readFileSync(headerPath, 'utf8');
        const footer = fs.readFileSync(footerPath, 'utf8');

        // Send welcome email if user has email
        if (user.email) {
            try {
                const { sendEmail } = await import('@/utils/sendEmail');
                const { WELCOME_EMAIL_SUBJECT } = await import('@/utils/emailSubjects');
                const nameVal = user.name || '';
                const displayName = nameVal ? nameVal : (user.mobile || 'Customer');

                const html = ` ${header}
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
