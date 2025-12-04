
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Notification from '@/models/Notification';

/**
 * @swagger
 * /api/notifications/unread-count:
 *   get:
 *     summary: Get unread notification count for a user
 *     tags:
 *       - Notifications
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user's ID
 *       - in: query
 *         name: role
 *         required: true
 *         schema:
 *           type: string
 *           enum: [admin, customer]
 *         description: The user's role
 *     responses:
 *       200:
 *         description: Unread notification count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                   description: Number of unread notifications
 *       400:
 *         description: Missing userId or role
 */

// GET /api/notifications/unread-count?userId=...&role=...
export async function GET(request: NextRequest) {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const role = searchParams.get('role');
    if (!userId || !role) {
        return NextResponse.json({ success: false, error: 'userId and role required' }, { status: 400 });
    }
    const count = await Notification.countDocuments({ userId, role, isRead: false });
    return NextResponse.json({ success: true, count });
}
