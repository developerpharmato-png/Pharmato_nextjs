/**
 * @swagger
 * /api/admin/customers/notifications/detail:
 *   post:
 *     summary: Get notification detail by ID (with paginated recipients)
 *     tags:
 *       - Admin-Customer
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
 *               limit:
 *                 type: integer
 *                 description: Number of recipients per page
 *                 example: 10
 *               offset:
 *                 type: integer
 *                 description: Page number (starts from 1)
 *                 example: 1
 *     responses:
 *       200:
 *         description: Notification detail with paginated recipients
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     title:
 *                       type: string
 *                     message:
 *                       type: string
 *                     recipients:
 *                       type: array
 *                       items:
 *                         type: string
 *                     recipientsTotal:
 *                       type: integer
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Missing or invalid ID
 *       404:
 *         description: Notification not found
 */

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import AdminCustomerNotification from '@/models/AdminCustomerNotification';

// POST /api/admin/customers/notifications/detail
export async function POST(request: NextRequest) {
    await dbConnect();
    try {
        const body = await request.json().catch(() => ({}));
        const { id, limit, offset } = body;

        if (!id) {
            return NextResponse.json({ status: false, message: 'Notification ID is required' }, { status: 400 });
        }

        // Find notification by ID
        const notification = await AdminCustomerNotification.findById(id);
        if (!notification) {
            return NextResponse.json({ status: false, message: 'Notification not found' }, { status: 404 });
        }

        // Paginate recipients
        const recipients = Array.isArray(notification.recipients) ? notification.recipients : [];
        const pageLimit = Number(limit) || 10;
        const page = Math.max(1, Number(offset) || 1);
        const skip = (page - 1) * pageLimit;
        const paginatedRecipientIds = recipients.slice(skip, skip + pageLimit);

        // Fetch user details for paginated recipients
        let users = [];
        if (paginatedRecipientIds.length > 0) {
            const User = (await import('@/models/User')).default;
            users = await User.find({ _id: { $in: paginatedRecipientIds } }).select('_id uniqueCode name email phone');
        }

        // Return notification detail with paginated user details
        const notificationData = {
            ...notification.toObject(),
            recipients: users,
            recipientsTotal: recipients.length
        };

        return NextResponse.json({ status: true, data: notificationData });
    } catch (err: any) {
        console.error('API Error:', err.message);
        return NextResponse.json({ status: false, message: err.message || 'Failed to fetch notification detail' }, { status: 500 });
    }
}
