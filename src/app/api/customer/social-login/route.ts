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
import { sendPushNotificationWithData } from '@/utils/firebase.helper';
import Admin from '@/models/Admin';
import Notification from '@/models/Notification';

export async function POST(request: NextRequest) {
  await connectDB();
  const { provider, socialId, name, email, deviceToken } = await request.json();
  if (!provider || !socialId) {
    return NextResponse.json({ success: false, error: 'Provider and socialId required' }, { status: 400 });
  }

  const checkDeviceToken = await User.find({ deviceToken: deviceToken });

  if (checkDeviceToken && checkDeviceToken.length > 0) {
    for (const element of checkDeviceToken) {

      element.deviceToken = "";
      await element.save();

    }
  }

  let user = await User.findOne({ socialProvider: provider, socialId });
  if (!user) {
    user = await User.create({ socialProvider: provider, socialId, name, email, isVerified: true, deviceToken });

    if (deviceToken) {
      user.deviceToken = deviceToken;
    } else {
      user.deviceToken = "";
    }

    // Send welcome notification
    try {
      const Notification = (await import('@/models/Notification')).default;
      await Notification.create({
        userId: user._id.toString(),
        role: 'customer',
        title: 'Welcome to Pharmato!',
        message: `“Welcome to Pharmato: Your health essentials are just a tap away!”`,
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
          body: `“Welcome to Pharmato: Your health essentials are just a tap away!”`,
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
<!DOCTYPE html>
<html>

<head>
  <meta charset="UTF-8" />
  <title>Welcome to Pharmato</title>
</head>

<body style="margin:0; padding:0; background-color:#f4f6f8; font-family: Arial, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8; padding:20px 0;">
    <tr>
      <td align="center">

        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:8px; padding:30px;">

          <!-- Logo / Header -->
          <tr>
            <td align="center" style="padding-bottom:20px;">
              <h2 style="margin:0; color:#2c3e50;">Welcome to Pharmato 👋</h2>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="color:#333333; font-size:16px; line-height:1.6;">
              <p>Hello ${displayName},</p>

              <p>
                We’re glad to have you with us.
              </p>

              <p>
                Pharmato makes ordering medicines and healthcare essentials simple, safe, and convenient.
                Upload your doctor’s prescription, place your order, and let us take care of the rest —
                right from verified pharmacies to your doorstep.
              </p>

              <p><strong>With Pharmato, you can:</strong></p>

              <ul style="padding-left:20px;">
                <li>Order medicines easily</li>
                <li>Upload and manage prescriptions securely</li>
                <li>Get medicines delivered to your home</li>
                <li>Track your orders in real time</li>
              </ul>

              <p>
                Start exploring now and experience hassle-free healthcare delivery.
              </p>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding:25px 0;">
              <a href="${process.env.PHARMATO_WEB_BASE_URL}" style="background-color:#2ecc71;
                        color:#ffffff;
                        padding:12px 25px;
                        text-decoration:none;
                        border-radius:5px;
                        font-size:16px;
                        display:inline-block;">
                Start Exploring
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="font-size:14px; color:#777777; line-height:1.6;">
              <p>
                Stay healthy,<br />
                <strong>Team Pharmato</strong><br />
                Your trusted pharmacy partner
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>

</html>
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
            message: `New User Registered: ${user.name || 'Customer'} has joined Pharmato using ${user.email}.`,
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
                body: `New User Registered: ${user.name || 'Customer'} has joined Pharmato using ${user.email}.`,
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

  // Issue access and refresh tokens
  const accessToken = signJwt({ userId: user._id, mobile: user.mobile, provider, role: 'customer' }, '24h');
  const refreshToken = signJwt({ userId: user._id, mobile: user.mobile, provider, role: 'customer' }, undefined); // default: no expiry
  user.refreshToken = refreshToken;
  await user.save();
  return NextResponse.json({ success: true, message: 'Social login successful', user, accessToken, refreshToken });
}
