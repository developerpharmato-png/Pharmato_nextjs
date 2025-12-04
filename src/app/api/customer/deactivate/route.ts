import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

/**
 * @swagger
 * /api/customer/deactivate:
 *   post:
 *     summary: Deactivate customer account (logout everywhere)
 *     tags:
 *       - Customer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 example: "652e1a2b3c4d5e6f7a8b9c0d"
 *     responses:
 *       200:
 *         description: Account deactivated
 *       404:
 *         description: User not found
 */
export async function POST(request: NextRequest) {
    await connectDB();
    const { id } = await request.json();
    if (!id) {
        return NextResponse.json({ success: false, error: 'User id required' }, { status: 400 });
    }
    const user = await User.findById(id);
    if (!user) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    user.isActive = false;
    user.deviceToken = '';
    user.refreshToken = '';
    await user.save();
    return NextResponse.json({ success: true, message: 'Account deactivated successfully' }, { status: 200 });
}
