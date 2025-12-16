import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import Razorpay from 'razorpay';

const razorpayInstance = new Razorpay({
    key_id: process.env.razorPay_Key_Id || '',
    key_secret: process.env.razorPay_Secret_Key || ''
});

/**
 * @swagger
 * /api/razorpay/webhook:
 *   post:
 *     summary: Razorpay webhook endpoint
 *     description: Receives payment and order events from Razorpay
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook received
 *       400:
 *         description: Invalid signature
 */

export async function POST(req: NextRequest) {
    await dbConnect();
    const body = await req.json();

    if (body?.payload?.payment?.entity) {
        let paymentHistory: any = {};
        const entity = body.payload.payment.entity;
        console.log(entity);
        const orderId = entity.notes?.razorpay_order_id;

        paymentHistory.orderId = orderId;
        paymentHistory.entity = entity;

        // Find the order in DB
        const checkOrder = await Order.findOne({ order_id: orderId });

        if (checkOrder) {
            if (body.event === 'payment.authorized') {
                const amount = entity.amount;
                const currency = entity.currency;

                try {
                    const captureResponse = await razorpayInstance.payments.capture(entity.id, amount, currency);
                } catch (error) { }
            }

            if (body.event === 'payment.captured') {
                await Order.updateOne(
                    { _id: checkOrder._id },
                    {
                        $push: { paymentHistory: paymentHistory },
                        $set: {
                            paymentStatus: 'Success',
                            payment_mode: entity.method || '',
                            payment_id: entity.id || '',
                            payment_status: entity.status || ''
                        }
                    }
                );
            }

            if (body.event === 'payment.failed') {
                await Order.updateOne(
                    { _id: checkOrder._id },
                    {
                        $push: { paymentHistory: paymentHistory },
                        $set: { payment_status: 'Failure' }
                    }
                );
            }
        }
    }

    return NextResponse.json({ status: true, message: 'Webhook processed (direct)' });
}
