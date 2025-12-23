import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';

/**
 * @swagger
 * /api/admin/order/partial-cancel:
 *   post:
 *     summary: Partially cancel selected medicines in an order
 *     tags:
 *       - Admin Orders
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
 *               medicineIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of medicine ObjectIds to cancel
 *                 required: true
 *               cancelReason:
 *                 type: string
 *                 description: Reason for cancellation
 *     responses:
 *       200:
 *         description: Medicines cancelled successfully
 *       400:
 *         description: Missing or invalid input
 *       404:
 *         description: Order not found
 */

export async function POST(req: NextRequest) {
    await dbConnect();
    try {
        const { orderId, medicineIds, cancelReason } = await req.json();
        if (!orderId || !Array.isArray(medicineIds) || medicineIds.length === 0) {
            return NextResponse.json({ success: false, message: 'orderId and medicineIds are required' }, { status: 400 });
        }
        const order = await Order.findOne({ _id: orderId });
        if (!order) {
            return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
        }
        let updated = false;
        order.medicineQuantity = order.medicineQuantity.map((item: any) => {
            if (medicineIds.includes(item.medicineId.toString()) && item.status === 'pending') {
                updated = true;
                return { ...item, status: 'cancelled', cancelReason: cancelReason || '' };
            }
            return item;
        });
        if (!updated) {
            return NextResponse.json({ success: false, message: 'No medicines updated (already cancelled or not found)' }, { status: 400 });
        }
        await order.save();
        return NextResponse.json({ success: true, message: 'Selected medicines cancelled successfully', data: order });
    } catch (error) {
        console.error('Partial cancel error:', error);
        return NextResponse.json({ success: false, message: 'Failed to cancel medicines', error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
}
