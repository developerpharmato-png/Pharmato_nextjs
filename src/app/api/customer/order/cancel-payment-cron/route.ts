import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';

/**
 * @swagger
 * /api/customer/order/cancel-payment-cron:
 *   post:
 *     summary: Cancel all pending payments and orders
 *     description: Finds all orders with payment_status and order_status as 'Pending' and updates them to 'Failed' and 'Cancelled' respectively.
 *     responses:
 *       200:
 *         description: All pending orders updated
 *       500:
 *         description: Internal server error
 */
export async function POST(req: NextRequest) {
    await dbConnect();
    try {
        // Find all orders where payment_status and order_status are both 'Pending'
        const filter = { payment_status: 'Pending', order_status: 'Pending' };
        const update = { $set: { payment_status: 'Failed', order_status: 'Cancelled' } };
        const result = await Order.updateMany(filter, update);
        return NextResponse.json({ status: true, message: 'All pending orders updated to Cancelled/Failed', modifiedCount: result.modifiedCount });
    } catch (error: any) {
        return NextResponse.json({ status: false, message: 'Internal server error', error: error?.message || String(error) }, { status: 500 });
    }
}
