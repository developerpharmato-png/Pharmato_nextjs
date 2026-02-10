import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Notification from '@/models/Notification';

/**
 * @swagger
 * /api/notifications/mark-read-all:
 *   post:
 *     summary: Mark all notifications as read for a user
 *     tags:
 *       - Notifications
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User ID
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 count:
 *                   type: integer
 *       400:
 *         description: Missing userId
 */

export async function POST(request: NextRequest) {
    await connectDB();
    const body = await request.json();
    const userId = body.userId;
    if (!userId) {
        return NextResponse.json({ success: false, message: 'User ID required' }, { status: 400 });
    }
    const result = await Notification.updateMany(
        { userId: userId, isRead: false },
        { $set: { isRead: true } }
    );
    return NextResponse.json({ success: true, message: 'All notifications marked as read', count: result.modifiedCount || 0 });
}
