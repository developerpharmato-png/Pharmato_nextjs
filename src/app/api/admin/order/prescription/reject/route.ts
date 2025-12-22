import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import Notification from '@/models/Notification';
import { sendEmail } from '@/utils/sendEmail';
import fs from 'fs';
import path from 'path';
import { sendPushNotification } from '@/utils/firebase.helper';

/**
 * @swagger
 * /api/admin/order/prescription/reject:
 *   post:
 *     summary: Reject prescription for an order
 *     tags:
 *       - Admin Orders - Prescription
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId:
 *                 type: string
 *                 description: Order's ObjectId
 *                 required: true
 *               adminId:
 *                 type: string
 *                 description: Admin's ObjectId
 *                 required: true
 *               rejectionReason:
 *                 type: string
 *                 description: Reason for rejection
 *                 required: true
 *     responses:
 *       200:
 *         description: Prescription rejected successfully
 *       400:
 *         description: Missing or invalid input
 *       404:
 *         description: Order not found
 */

export async function POST(req: NextRequest) {
    await dbConnect();

    try {
        const { orderId, adminId, rejectionReason, prescription_url } = await req.json();

        if (!orderId || !adminId || !rejectionReason) {
            return NextResponse.json(
                { success: false, message: 'orderId, adminId, and rejectionReason are required' },
                { status: 400 }
            );
        }

        const order = await Order.findById(orderId).populate({ path: 'userId', select: '_id name email mobile phone' });

        if (!order) {
            return NextResponse.json(
                { success: false, message: 'Order not found' },
                { status: 404 }
            );
        }

        // Update prescription status and optional prescription URL
        order.prescription_status = 'Rejected';
        order.prescription_rejected_by = adminId;
        order.prescription_rejected_at = new Date();
        order.prescription_rejection_reason = rejectionReason;
        if (prescription_url && typeof prescription_url === 'string') {
            order.prescription_url = prescription_url;
        }

        await order.save();

        // Create in-app notification for customer
        try {
            const userIdStr = order.userId && (order.userId._id ? order.userId._id.toString() : order.userId.toString());
            if (userIdStr) {
                await Notification.create({
                    userId: userIdStr,
                    role: 'customer',
                    title: 'Prescription Rejected',
                    message: `Your prescription for order ${order.order_id} was rejected. Reason: ${rejectionReason}`,
                    type: 'prescription_rejected',
                    targetScreen: 'orders/detail/prescription_reupload',
                    targetId: order._id.toString(),
                    meta: {
                        orderId: order._id.toString(),
                        rejectionReason
                    }
                });
            }
        } catch (notifErr) {
            console.error('Notification create error:', notifErr);
        }

        // Send notification if deviceToken exists
        const user = order.userId;
        if (user && user.deviceToken) {
            try {
                await sendPushNotification({
                    token: user.deviceToken,
                    title: 'Pharmato',
                    body: `Your prescription for order ${order.order_id} has been rejected.`
                });
            } catch (err) {
                console.error('Failed to send notification:', err);
            }
        }

        // Send email to customer if email available using template
        try {
            const userEmail = order.userId && (order.userId.email || order.userId.email === '' ? order.userId.email : null);
            if (userEmail) {
                const base = process.env.NEXT_PUBLIC_BASE_URL || '';
                const orderUrl = `${base}/customer/orders/${order._id}`;
                const subject = `Prescription Rejected - Order ${order.order_id}`;
                const headerPath = path.join(process.cwd(), 'src/app/api/admin/html-templates/emailHeader.html');
                const footerPath = path.join(process.cwd(), 'src/app/api/admin/html-templates/emailFooter.html');
                const contentPath = path.join(process.cwd(), 'src/app/api/admin/html-templates/prescriptionRejected.html');
                let html = '';
                try {
                    let header = fs.readFileSync(headerPath, 'utf8');
                    // Replace baseUrl placeholder so images have absolute URL in email clients
                    const baseForEmail = base || (process.env.NEXT_PUBLIC_BASE_URL || '');
                    header = header.replace(/{{baseUrl}}/g, baseForEmail);
                    const content = fs.readFileSync(contentPath, 'utf8')
                        .replace(/{{name}}/g, (order.userId && order.userId.name) || '')
                        .replace(/{{orderId}}/g, order.order_id || '')
                        .replace(/{{reason}}/g, rejectionReason || '')
                        .replace(/{{orderUrl}}/g, orderUrl);
                    const footer = fs.readFileSync(footerPath, 'utf8');
                    html = header + content + footer;
                } catch (readErr) {
                    console.error('Email template read error:', readErr);
                    // fallback simple html
                    html = `<p>Hi ${(order.userId && order.userId.name) || ''},</p><p>Your prescription for order <strong>${order.order_id}</strong> has been rejected. Reason: ${rejectionReason}</p>`;
                }
                await sendEmail({ to: userEmail, subject, html });
            }
        } catch (emailErr) {
            console.error('Email send error on reject:', emailErr);
        }

        return NextResponse.json({
            success: true,
            message: 'Prescription rejected successfully',
            data: order
        });

    } catch (error) {
        console.error('Error rejecting prescription:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to reject prescription' },
            { status: 500 }
        );
    }
}
