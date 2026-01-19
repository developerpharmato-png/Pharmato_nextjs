import { OTP_EMAIL_SUBJECT } from '@/utils/emailSubjects';
import { sendEmail } from '@/utils/sendEmail';
import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import dbConnect from '@/lib/mongodb';
import fs from 'fs';
import path from 'path';

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * @swagger
 * /api/customer/send-otp-email:
 *   post:
 *     summary: Send OTP for email update
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
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "656e1234abcd5678efgh9012"
 *               email:
 *                 type: string
 *                 example: "customer@example.com"
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
 *       404:
 *         description: User not found
 */
export async function POST(req: NextRequest) {
    await dbConnect();
    const { userId, email } = await req.json();
    if (!userId || !email) {
        return NextResponse.json({ success: false, error: 'userId and email required' }, { status: 400 });
    }
    const user = await User.findById(userId);
    if (!user) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Choose template based on create or update
    const headerPath = path.join(process.cwd(), 'src/app/api/admin/html-templates/emailHeader.html');
    const footerPath = path.join(process.cwd(), 'src/app/api/admin/html-templates/emailFooter.html');
    const header = fs.readFileSync(headerPath, 'utf8');
    const footer = fs.readFileSync(footerPath, 'utf8');

    // user.email = email;
    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 min expiry
    await user.save();
    await sendEmail({
        to: email,
        subject: OTP_EMAIL_SUBJECT,
        html: `${header}
            <p>Hello,</p>
            <p>We received a request to update your email address on <b>Pharmato</b>.</p>
            <p>Your One-Time Password (OTP) is:</p>
            <h2 style="color:#2e7d32;letter-spacing:2px;">${otp}</h2>
            <p>This OTP is valid for <b>5 minutes</b>. Please do not share this code with anyone.</p>
            <p>If you did not request this change, please ignore this email or contact our support team immediately.</p>
            <p>Thank you,<br><b>Team Pharmato</b></p>
            ${footer}
        `
    });
    return NextResponse.json({ success: true, message: 'OTP Sent Successfully.' });
}
