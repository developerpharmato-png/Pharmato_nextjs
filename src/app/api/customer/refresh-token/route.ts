/**
 * @swagger
 * /api/customer/refresh-token:
 *   post:
 *     summary: Generate new access token using refresh token
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
 *               refreshToken:
 *                 type: string
 *                 example: "REFRESH_TOKEN"
 *     responses:
 *       200:
 *         description: New access token generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 accessToken:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid refresh token
 */
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { verifyJwt, signJwt } from '@/lib/jwt';

export async function POST(request: NextRequest) {
    await connectDB();
    const { userId, refreshToken } = await request.json();
    if (!userId || !refreshToken) {
        return NextResponse.json({ success: false, error: 'User object id and refresh token required' }, { status: 400 });
    }
    const user = await User.findById(userId);
    if (!user || user.refreshToken !== refreshToken) {
        return NextResponse.json({ success: false, error: 'Invalid refresh token' }, { status: 401 });
    }
    const decoded = verifyJwt(refreshToken);
    if (!decoded) {
        return NextResponse.json({ success: false, error: 'Invalid refresh token' }, { status: 401 });
    }
    // Issue new access token (24h)
    const accessToken = signJwt({ userId: user._id, mobile: user.mobile }, '24h');
    return NextResponse.json({ success: true, accessToken, user });
}
