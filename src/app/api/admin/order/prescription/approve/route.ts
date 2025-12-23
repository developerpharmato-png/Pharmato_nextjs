import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import Notification from '@/models/Notification';
import { sendEmail } from '@/utils/sendEmail';
import { sendPushNotificationWithData } from '@/utils/firebase.helper';
import fs from 'fs';
import path from 'path';

/**
 * @swagger
 * /api/admin/order/prescription/approve:
 *   post:
 *     summary: Approve prescription for an order
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
 *     responses:
 *       200:
 *         description: Prescription approved successfully
 *       400:
 *         description: Missing or invalid input
 *       404:
 *         description: Order not found
 */

export async function POST(req: NextRequest) {
    await dbConnect();

    try {
        const { orderId, adminId, approvalNotes } = await req.json();

        if (!orderId || !adminId) {
            return NextResponse.json(
                { success: false, message: 'orderId and adminId are required' },
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

        // Update prescription status
        order.prescription_status = 'Approved';
        order.prescription_approved_by = adminId;
        order.prescription_approved_at = new Date();
        order.prescription_approval_notes = approvalNotes || '';
        order.prescription_rejection_reason = '';

        // Update order status if it was in re-upload required state
        if (order.order_status === 'Prescription Re-upload Required') {
            order.order_status = 'Confirmed';
        }

        await order.save();

        // Send email to customer if email available using template
        let mailRes: any = null;
        try {
            const userEmail = order.userId && order.userId.email ? order.userId.email : null;
            if (userEmail && userEmail.trim() !== '') {
                console.log('Preparing approval email for:', userEmail);
                const base = process.env.NEXT_PUBLIC_BASE_URL || '';
                const orderUrl = `${base}/customer/orders/${order._id}`;
                const subject = `Prescription Approved - Order ${order.order_id}`;
                const headerPath = path.join(process.cwd(), 'src/app/api/admin/html-templates/emailHeader.html');
                const footerPath = path.join(process.cwd(), 'src/app/api/admin/html-templates/emailFooter.html');
                const contentPath = path.join(process.cwd(), 'src/app/api/admin/html-templates/prescriptionApproved.html');
                let html = '';
                try {
                    let header = fs.readFileSync(headerPath, 'utf8');
                    const baseForEmail = base || (process.env.NEXT_PUBLIC_BASE_URL || '');
                    header = header.replace(/{{baseUrl}}/g, baseForEmail);
                    const content = fs.readFileSync(contentPath, 'utf8')
                        .replace(/{{name}}/g, (order.userId && order.userId.name) || '')
                        .replace(/{{orderId}}/g, order.order_id || '')
                        .replace(/{{orderUrl}}/g, orderUrl);
                    const footer = fs.readFileSync(footerPath, 'utf8');
                    html = header + content + footer;
                } catch (readErr) {
                    console.error('Email template read error:', readErr);
                    html = `<p>Hi ${(order.userId && order.userId.name) || ''},</p><p>Your prescription for order <strong>${order.order_id}</strong> has been approved.</p>`;
                }
                mailRes = await sendEmail({ to: userEmail, subject, html });
                console.log('Approval email send result:', mailRes);
            }
        } catch (emailErr) {
            console.error('Email send error on approve:', emailErr);
        }

        // Create in-app notification for customer
        let notifRes: any = null;
        try {
            const userIdStr = order.userId && (order.userId._id ? order.userId._id.toString() : order.userId.toString());
            if (userIdStr) {
                notifRes = await Notification.create({
                    userId: userIdStr,
                    role: 'customer',
                    title: 'Prescription Approved',
                    message: `Your prescription for order ${order.order_id} was approved.`,
                    type: 'prescription_approved',
                    targetScreen: 'orders/detail',
                    targetId: order._id.toString(),
                    meta: { orderId: order._id.toString() }
                });
            }
        } catch (notifErr) {
            console.error('Notification create error (approve):', notifErr);
        }

        // Send notification if deviceToken exists
        const user = order.userId;
        if (user && user.deviceToken) {
            try {
                await sendPushNotificationWithData({
                    token: user.deviceToken,
                    title: 'Pharmato',
                    body: `Your prescription for order ${order.order_id} has been approved.`,
                    data: {
                        orderId: order._id.toString(),
                        type: 'prescription_approved',
                        targetScreen: 'orders/detail'
                    }
                });
            } catch (err) {
                console.error('Failed to send notification:', err);
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Prescription approved successfully',
            data: order,
            mail: mailRes,
            notification: notifRes
        });

    } catch (error) {
        console.error('Error approving prescription:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to approve prescription' },
            { status: 500 }
        );
    }
}
