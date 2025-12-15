import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Replace with your Razorpay webhook secret
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || '';

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

    // Extract payment entity and orderId
    if (body?.payload?.payment?.entity) {
        const entity = body.payload.payment.entity;
        const orderId = entity.notes?.razorpay_order_id;

        // TODO: Add your business logic here, e.g., update order status in DB

        return NextResponse.json({ status: true, message: 'Payment entity processed', orderId });
    }

    return NextResponse.json({ status: false, message: 'No payment entity found' }, { status: 400 });
}
