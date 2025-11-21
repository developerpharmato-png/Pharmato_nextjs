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
    } else {
        if (deviceToken) {
            user.deviceToken = deviceToken;
        } else {
            user.deviceToken = undefined;
        }
        await user.save();
    }
    // Issue access and refresh tokens
    const accessToken = signJwt({ userId: user._id, mobile: user.mobile, provider }, '24h');
    const refreshToken = signJwt({ userId: user._id, mobile: user.mobile, provider }, undefined); // default: no expiry
    user.refreshToken = refreshToken;
    await user.save();
    return NextResponse.json({ success: true, message: 'Social login successful', user, accessToken, refreshToken });
}
