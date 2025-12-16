import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import Razorpay from 'razorpay';

const RAZORPAY_WEBHOOK_SECRET = process.env.razorPay_Secret_Key || '';
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
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    // Validate signature
    const expectedSignature = crypto
        .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');

    if (signature !== expectedSignature) {
        return NextResponse.json({ status: false, message: 'Invalid signature' }, { status: 400 });
    }

    let body;
    try {
        body = JSON.parse(rawBody);
    } catch (err) {
        return NextResponse.json({ status: false, message: 'Invalid JSON' }, { status: 400 });
    }

    if (body?.payload?.payment?.entity) {
        let paymentHistory: any = {};
        const entity = body.payload.payment.entity;
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
                    // Uncomment and configure if you want to capture payment
                    const captureResponse = await razorpayInstance.payments.capture(entity.id, amount, currency);
                    // Optionally log captureResponse
                } catch (error) {
                    // Optionally log error
                }
            }

            if (body.event === 'payment.captured') {
                await Order.updateOne(
                    { _id: checkOrder._id },
                    {
                        $push: { paymentHistory: paymentHistory },
                        $set: { paymentStatus: 'Success' }
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

    return NextResponse.json({ status: true, message: 'Webhook processed' });
}
