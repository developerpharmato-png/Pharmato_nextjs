/**
 * @swagger
 * /api/admin/customers/notifications:
 *   post:
 *     summary: Customer Notifications
 *     tags:
 *       - Admin-Customer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["USER_OBJECT_ID1", "USER_OBJECT_ID2"]
 *               title:
 *                 type: string
 *                 example: "Notification Title"
 *               message:
 *                 type: string
 *                 example: "Your notification message"
 *     responses:
 *       200:
 *         description: Notification send result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 sentTo:
 *                   type: array
 *                   items:
 *                     type: string
 *                 notFound:
 *                   type: array
 *                   items:
 *                     type: string
 */


import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Wallet from '@/models/Wallet';
import moment from 'moment';
import { sendPushNotificationWithData } from '@/utils/firebase.helper';


export async function POST(request: NextRequest) {
    await dbConnect();
    const body = await request.json();
    const { userIds, title, message } = body;

    if (!Array.isArray(userIds) || userIds.length === 0 || !userIds.every(id => typeof id === 'string' && id.trim() !== '')) {
        return NextResponse.json({ status: false, message: 'userIds must be a non-empty array of strings' }, { status: 400 });
    }
    if (!title || typeof title !== 'string') {
        return NextResponse.json({ status: false, message: 'title is required and must be a string' }, { status: 400 });
    }
    if (!message || typeof message !== 'string') {
        return NextResponse.json({ status: false, message: 'message is required and must be a string' }, { status: 400 });
    }

    // Check which userIds are valid
    const users = await User.find({ _id: { $in: userIds } }).select('_id email deviceToken');
    const foundUserIds = users.map(u => u._id.toString());
    const notFound = userIds.filter(id => !foundUserIds.includes(id));

    for (const user of users) {
        console.log("$$$$$$$$$user$$$$$$$$$$$",user);
        if (user?.deviceToken) {
            try {
                const Notification = (await import('@/models/Notification')).default;
                await Notification.create({
                    userId: user._id.toString(),
                    role: 'customer',
                    title: title,
                    message: message,
                    type: 'custom',
                    isRead: false,
                    createdAt: new Date(),
                });
            } catch (err) {
                console.error('Failed to create notification:', err);
            }

            try {
                await sendPushNotificationWithData({
                    token: (user as any).deviceToken,
                    title: title,
                    body: message,
                    data: {}
                });
            } catch (err) {
                console.error('Failed to send push notification:', err);
            }

        }
    }

    return NextResponse.json({
        status: true,
        message: `Notification sent to ${foundUserIds.length} user(s).` + (notFound.length ? ` User(s) not found: ${notFound.join(', ')}` : ''),
        sentTo: foundUserIds,
        notFound
    });
    
}
