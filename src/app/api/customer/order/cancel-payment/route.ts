import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';

/**
 * @swagger
 * /api/customer/order/cancel-payment:
 *   post:
 *     summary: Cancel payment for an order
 *     description: Cancels the payment for a given order and updates its status.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               order_id_fk:
 *                 type: string
 *                 description: The order ID to cancel payment for
 *     responses:
 *       200:
 *         description: Payment cancelled and order updated
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal server error
 */
export async function POST(req: NextRequest) {
    await dbConnect();
    try {
        const body = await req.json();
        const { order_id_fk } = body;
        if (!order_id_fk) {
            return NextResponse.json({ status: false, message: 'order_id_fk is required' }, { status: 400 });
        }
        const order = await Order.findOne({ _id: order_id_fk });
        if (!order) {
            return NextResponse.json({ status: false, message: 'Order not found' }, { status: 404 });
        }
        await Order.updateOne(
            { _id: order_id_fk },
            {
                $set: {
                    order_status: 'Cancelled',
                    payment_status: 'Failed',
                },
            }
        );
        return NextResponse.json({ status: true, message: 'Order cancelled and payment status set to Failed' });
    } catch (error: any) {
        return NextResponse.json({ status: false, message: 'Internal server error', error: error?.message || String(error) }, { status: 500 });
    }
}
