/**
 * @swagger
 * /api/customer/login:
 *   post:
 *     summary: Login with mobile number (send OTP)
 *     tags:
 *       - Customer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
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
 *       403:
 *         description: User is blocked
 *       429:
 *         description: Too many OTP requests
 */
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import fs from 'fs';
import path from 'path';

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
    await connectDB();

    const { mobile, countryCode } = await request.json();

    if (!mobile) {
        return NextResponse.json({ success: false, error: 'Mobile number required' }, { status: 400 });
    }

    // Find user or create new
    let user = await User.findOne({ mobile, countryCode });
    const now = new Date();

    // ===========================
    // 1️⃣ Blocked User Check
    // ===========================
    if (user && user.isBlocked && user.userBlockedTime && user.userBlockedTime > now) {

        const timeLeftMs = user.userBlockedTime.getTime() - now.getTime();
        const minutesLeft = Math.floor(timeLeftMs / 60000);
        const secondsLeft = Math.floor((timeLeftMs % 60000) / 1000);

        return NextResponse.json(
            {
                success: false,
                error: `User is blocked. Try again after ${minutesLeft}m ${secondsLeft}s.`
            },
            { status: 403 }
        );
    }


    // ======================================================
    // 2️⃣ OTP Limit Check → If >=5 OTP in 1 hour → Block 15 min
    // ======================================================
    if (
        user &&
        user.otpCount &&
        user.otpCount >= 50 &&
        user.otpGenerateTime &&
        (now.getTime() - new Date(user.otpGenerateTime).getTime()) < 60 * 60 * 1000
    ) {
        // Block for 15 minutes
        user.isBlocked = true;
        user.userBlockedTime = new Date(now.getTime() + 15 * 60 * 1000);
        user.otpCount = 0; // reset otp count after blocking
        await user.save();

        return NextResponse.json(
            { success: false, error: 'Too many OTP requests. You are blocked for 15 minutes.' },
            { status: 429 }
        );
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpires = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes

    let isNewUser = false;

    // ===========================
    // 3️⃣ New user
    // ===========================
    if (!user) {
        user = await User.create({
            mobile,
            countryCode,
            otp,
            otpGenerateTime: now,
            otpExpires,
            incorrectOtpAttempt: 0,
            otpCount: 1,
            isBlocked: false,
        });

        isNewUser = true;

    } else {
        // ===========================
        // 4️⃣ Existing user update
        // ===========================

        // If 1 hour passed since last OTP → reset otpCount
        if (user.otpGenerateTime && (now.getTime() - new Date(user.otpGenerateTime).getTime()) >= 60 * 60 * 1000) {
            user.otpCount = 0;
        }

        user.otp = otp;
        user.otpGenerateTime = now;
        user.otpExpires = otpExpires;
        user.incorrectOtpAttempt = 0;
        user.otpCount = (user.otpCount || 0) + 1;
        user.isBlocked = false; // ensure not blocked (only when block time expired)
        await user.save();
    }

    // Choose template based on create or update
    const headerPath = path.join(process.cwd(), 'src/app/api/admin/html-templates/emailHeader.html');
    const footerPath = path.join(process.cwd(), 'src/app/api/admin/html-templates/emailFooter.html');
    const header = fs.readFileSync(headerPath, 'utf8');
    const footer = fs.readFileSync(footerPath, 'utf8');

    // =====================================
    // 5️⃣ New User → Create Welcome Notification
    // =====================================
    if (isNewUser) {

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
                const name = user.name || '';
                const displayName = name ? name : (user.mobile || 'Customer');
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

    }

    // ===========================
    // 6️⃣ Return Response
    // ===========================
    return NextResponse.json(
        {
            success: true,
            message: 'OTP sent',
            otp, // remove in production
            userId: user._id,
            isActive: user.isActive,
            userDeActiveBy: user.userDeActiveBy || "",
            isNewUser: isNewUser
        },
        { status: 200 }
    );
}