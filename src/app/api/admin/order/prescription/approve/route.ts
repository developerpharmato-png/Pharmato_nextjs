import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';

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

        const order = await Order.findById(orderId);
        
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

        return NextResponse.json({  
            success: true, 
            message: 'Prescription approved successfully',
            data: order
        });

    } catch (error) {
        console.error('Error approving prescription:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to approve prescription' },
            { status: 500 }
        );
    }
}
