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
            isActive: user.isActive
        },
        { status: 200 }
    );
}