import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

/**
 * @swagger
 * /api/customer/activate-account:
 *   post:
 *     summary: Activate customer account
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
 *                 description: Customer's user ID
 *     responses:
 *       200:
 *         description: Account activated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Missing userId
 *       404:
 *         description: User not found
 */

export async function POST(request: NextRequest) {
    await dbConnect();
    const body = await request.json();
    const userId = body.userId;
    if (!userId) {
        return NextResponse.json({ success: false, message: 'userId is required' }, { status: 400 });
    }
    const user = await User.findById(userId);
    if (!user) {
        return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }
    user.isActive = true;
    await user.save();
    return NextResponse.json({ success: true, message: 'Account activated successfully' });
}
