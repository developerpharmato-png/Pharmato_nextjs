import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Notification from '@/models/Notification';

/**
 * @swagger
 * /api/notifications/mark-read:
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

export async function POST(request: NextRequest) {
    await connectDB();
    const body = await request.json();
    const id = body.id;
    if (!id) {
        return NextResponse.json({ success: false, message: 'Notification id required' }, { status: 400 });
    }
    const notification = await Notification.findById(id);
    if (!notification) {
        return NextResponse.json({ success: false, message: 'Notification not found' }, { status: 404 });
    }
    notification.isRead = true;
    await notification.save();
    return NextResponse.json({ success: true, message: 'Notification marked as read' });
}
