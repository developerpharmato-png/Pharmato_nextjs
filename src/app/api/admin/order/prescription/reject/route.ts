import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';

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
        const { orderId, adminId, rejectionReason } = await req.json();
        
        if (!orderId || !adminId || !rejectionReason) {
            return NextResponse.json(
                { success: false, message: 'orderId, adminId, and rejectionReason are required' },
                { status: 400 }
            );
        }

        const order = await Order.findById(orderId);
        
        if (!order) {
            return NextResponse.json(
                { success: false, message: 'Order not found' },
                { status: 404 }
            );
        }

        // Update prescription status
        order.prescription_status = 'Rejected';
        order.prescription_rejected_by = adminId;
        order.prescription_rejected_at = new Date();
        order.prescription_rejection_reason = rejectionReason;
        
        // Update order status to require re-upload
        order.order_status = 'Prescription Re-upload Required';

        await order.save();

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
