
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Notification from '@/models/Notification';

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get notifications for a user
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
 *       - in: query
 *         name: isRead
 *         required: false
 *         schema:
 *           type: boolean
 *         description: Filter notifications by read status (true for read, false for unread)
 *     responses:
 *       200:
 *         description: List of notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Notification'
 *       400:
 *         description: Missing userId or role
 *   post:
 *     summary: Mark a notification as read
 *     tags:
 *       - Notifications
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read
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
 *         description: Missing notification id
 *       404:
 *         description: Notification not found
 */

export async function GET(request: NextRequest) {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const role = searchParams.get('role');
    const isReadParam = searchParams.get('isRead');
    if (!userId || !role) {
        return NextResponse.json({ success: false, error: 'userId and role required' }, { status: 400 });
    }
    const query: any = { userId, role };
    if (isReadParam !== null) {
        // Accept 'true'/'false' as string, convert to boolean
        query.isRead = isReadParam === 'true';
    }
    const notifications = await Notification.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: notifications });
}

export async function POST(request: NextRequest) {
    await connectDB();
    const { id } = await request.json();
    if (!id) {
        return NextResponse.json({ success: false, error: 'Notification id required' }, { status: 400 });
    }
    const notification = await Notification.findById(id);
    if (!notification) {
        return NextResponse.json({ success: false, error: 'Notification not found' }, { status: 404 });
    }
    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();
    return NextResponse.json({ success: true, message: 'Notification marked as read' });
}
