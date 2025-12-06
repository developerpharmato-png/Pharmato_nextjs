
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Notification from '@/models/Notification';

/**
 * @swagger
 * /api/notifications/unread-count:
 *   post:
 *     summary: Get unread notification count for a user
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
 *                 description: The user's ID
 *               role:
 *                 type: string
 *                 enum: [admin, customer]
 *                 description: The user's role
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

// POST /api/notifications/unread-count
export async function POST(request: NextRequest) {
    await connectDB();
    const body = await request.json();
    const userId = body.userId;
    const role = body.role;
    if (!userId || !role) {
        return NextResponse.json({ success: false, error: 'userId and role required' }, { status: 400 });
    }
    const count = await Notification.countDocuments({ userId, role, isRead: false });
    return NextResponse.json({ success: true, count });
}
