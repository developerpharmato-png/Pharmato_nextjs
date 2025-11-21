/**
 * @swagger
 * /api/customer/logout:
 *   post:
 *     summary: Logout customer and clear refresh/device token
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
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request: NextRequest) {
    await connectDB();
    const { userId } = await request.json();
    if (!userId) {
        return NextResponse.json({ success: false, error: 'User object id required' }, { status: 400 });
    }
    const user = await User.findById(userId);
    if (!user) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    user.refreshToken = undefined;
    user.deviceToken = undefined;
    await user.save();
    return NextResponse.json({ success: true, message: 'Logout successful' });
}
