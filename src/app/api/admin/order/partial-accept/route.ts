import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import { getDb } from '@/utils/firebase.helper';

/**
 * @swagger
 * /api/admin/order/partial-accept:
 *   post:
 *     summary: Accept selected medicines in an order, cancel the rest
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
 *                 description: Array of medicine ObjectIds to accept
 *                 required: true
 *     responses:
 *       200:
 *         description: Medicines accepted/cancelled successfully
 *       400:
 *         description: Missing or invalid input
 *       404:
 *         description: Order not found
 */

export async function POST(req: NextRequest) {
    await dbConnect();
    try {
        const { orderId, medicineIds } = await req.json();
        if (!orderId || !Array.isArray(medicineIds)) {
            return NextResponse.json({ success: false, message: 'orderId and medicineIds are required' }, { status: 400 });
        }
        const order = await Order.findOne({ _id: orderId });
        if (!order) {
            return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
        }
        order.medicineQuantity = order.medicineQuantity.map((item: any) => {
            if (medicineIds.includes(item.medicineId.toString())) {
                return { ...item, status: 'accepted', cancelReason: '' };
            } else {
                return { ...item, status: 'cancelled', cancelReason: 'Cancelled by admin (not selected for acceptance)' };
            }
        });
        await order.save();

        // Update orderStatus in Firebase Realtime Database
        if (order?.order_id) {
            const db = getDb();
            const firebaseRef = db.ref(`orders/${order.order_id}`);
            const snapshot = await firebaseRef.once('value');
            const isOrderStatusChanged: any = Number(snapshot.val()?.isOrderStatusChanged || 0) + 1;
            await firebaseRef.update({
                isOrderStatusChanged: isOrderStatusChanged
            });
        }

        return NextResponse.json({ success: true, message: 'Selected medicines accepted, rest cancelled', data: order });
    } catch (error) {
        console.error('Partial accept error:', error);
        return NextResponse.json({ success: false, message: 'Failed to accept/cancel medicines', error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
}
