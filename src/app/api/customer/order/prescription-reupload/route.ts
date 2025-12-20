import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import mongoose from 'mongoose';

/**
 * @swagger
 * /api/customer/order/prescription-reupload:
 *   post:
 *     summary: Re-upload prescription for an order (customer)
 *     tags:
 *       - Customer Orders - Prescription
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
 *               url:
 *                 oneOf:
 *                   - type: string
 *                   - type: array
 *                     items:
 *                       type: string
 *                 description: URL or array of URLs of the uploaded prescription image/pdf
 *     responses:
 *       200:
 *         description: Prescription re-uploaded successfully
 *       400:
 *         description: Missing or invalid input
 *       404:
 *         description: Order not found
 */
export async function POST(req: NextRequest) {
    await dbConnect();
    try {
        const { orderId, url } = await req.json();

        if (!orderId || !url) {
            return NextResponse.json({ success: false, message: 'orderId and url are required' }, { status: 400 });
        }

        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return NextResponse.json({ success: false, message: 'Invalid orderId' }, { status: 400 });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
        }

        // Normalize url to array of strings
        let prescriptionUrlArr: string[] = [];
        if (Array.isArray(url)) {
            prescriptionUrlArr = url.filter((u) => typeof u === 'string');
        } else if (typeof url === 'string' && url) {
            prescriptionUrlArr = [url];
        }

        order.prescription_url = prescriptionUrlArr;
        order.prescription_status = 'Pending';
        order.prescription_rejection_reason = '';
        order.prescription_rejected_by = null;
        order.prescription_rejected_at = undefined;

        // // Ensure order_status indicates re-upload required so admin knows
        // order.order_status = 'Prescription Re-upload Required';

        await order.save();

        return NextResponse.json({ success: true, message: 'Prescription re-uploaded', data: order });
    } catch (err: any) {
        console.error('Prescription reupload error:', err);
        return NextResponse.json({ success: false, message: 'Failed to re-upload prescription', error: err?.message || String(err) }, { status: 500 });
    }
}
