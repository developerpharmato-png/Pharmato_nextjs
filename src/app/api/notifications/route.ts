
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Notification from '@/models/Notification';

/**
 * @swagger
 * /api/notifications:
 *   post:
 *     summary: Get notifications for a user
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
 *               limit:
 *                 type: integer
 *                 description: Number of notifications to return (default 20)
 *               offset:
 *                 type: integer
 *                 description: Number of notifications to skip (default 0)
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
 */

export async function POST(request: NextRequest) {
    await connectDB();
    const body = await request.json();
    const userId = body.userId;
    const role = body.role;
    const limit = typeof body.limit === 'number' && body.limit > 0 ? body.limit : 10;
    const offset = typeof body.offset === 'number' && body.offset > 0 ? (body.offset - 1) * limit : 0;
    if (!userId || !role) {
        return NextResponse.json({ success: false, error: 'userId and role required' }, { status: 400 });
    }
    const query: any = { userId, role };
    const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit);
    return NextResponse.json({ success: true, data: notifications });
}
