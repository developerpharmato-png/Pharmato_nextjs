
/**
 * @swagger
 * /api/admin/customers/notifications/list:
 *   post:
 *     summary: Get admin customer notifications list
 *     tags:
 *       - Admin-Customer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               limit:
 *                 type: integer
 *                 example: 10
 *               offset:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: List of admin customer notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AdminCustomerNotification'
 *                 total:
 *                   type: integer
 *       500:
 *         description: Failed to fetch notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import AdminCustomerNotification from '@/models/AdminCustomerNotification';

export async function POST(request: NextRequest) {
    await dbConnect();
    try {
        const body = await request.json();
        let { limit, offset } = body;
        limit = Number(limit) || 10;
        offset = (Number(offset) - 1) * limit || 0;

        const notifications = await AdminCustomerNotification.find()
            .sort({ createdAt: -1 })
            .skip(offset)
            .limit(limit);

        const total = await AdminCustomerNotification.countDocuments();

        return NextResponse.json({ status: true, data: notifications, total });
    } catch (err) {
        console.error('Failed to fetch admin customer notifications:', err);
        return NextResponse.json({ status: false, message: 'Failed to fetch notifications' }, { status: 500 });
    }
}
