import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import Notification from '@/models/Notification';
import { sendEmail } from '@/utils/sendEmail';

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
        // Update order status to require re-upload
        order.order_status = 'Prescription Re-upload Required';

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
                    targetScreen: 'orders',
                    targetId: order._id.toString(),
                    meta: { orderId: order._id.toString() }
                });
            }
        } catch (notifErr) {
            console.error('Notification create error:', notifErr);
        }

        // Send email to customer if email available
        try {
            const userEmail = order.userId && (order.userId.email || order.userId.email === '' ? order.userId.email : null);
            if (userEmail) {
                const subject = `Prescription Rejected - Order ${order.order_id}`;
                const html = `
                    <p>Hi ${order.userId.name || ''},</p>
                    <p>Your prescription for order <strong>${order.order_id}</strong> has been <strong>rejected</strong> by the pharmacy team.</p>
                    <p><strong>Reason:</strong> ${rejectionReason}</p>
                    <p>Please re-upload your prescription by visiting your orders in the app.</p>
                    <p>Regards,<br/>Pharmato Team</p>
                `;
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
