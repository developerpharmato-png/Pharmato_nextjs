import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';

/**
 * @swagger
 * /api/customer/order/detail:
 *   post:
 *     summary: Get detail of a specific order for a customer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User's ObjectId
 *               orderId:
 *                 type: string
 *                 description: Order's ObjectId
 *     responses:
 *       200:
 *         description: Order detail
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Missing or invalid input
 */

export async function POST(req: NextRequest) {
    await dbConnect();
    const { userId, orderId } = await req.json();
    if (!userId || typeof userId !== 'string' || !orderId || typeof orderId !== 'string') {
        return NextResponse.json({ status: false, message: 'userId and orderId are required' }, { status: 400 });
    }
    const order = await Order.findOne({ _id: orderId, userId }).populate({
        path: 'medicineId',
        select: '_id name manufacturer mrp price discount images coverImage'
    });
    if (!order) {
        return NextResponse.json({ status: false, message: 'Order not found' }, { status: 404 });
    }

    // Attach medicineQuantity to each medicine in medicineId
    const medicineQuantities = Array.isArray(order.medicineQuantity) ? order.medicineQuantity : [];
    const medicineIdWithQuantity = Array.isArray(order.medicineId)
        ? order.medicineId.map((med: any) => {
            // Find the quantity object for this medicine
            const q = medicineQuantities.find((qty: any) => {
                // qty.medicineId may be string or ObjectId
                return (qty.medicineId?.toString && med._id?.toString && qty.medicineId.toString() === med._id.toString());
            });
            return {
                ...med.toObject(),
                quantity: q?.quantity || 1 // fallback to 1 if not found
            };
        })
        : [];

    // Return order with updated medicineId array
    const orderObj = order.toObject();
    orderObj.medicineId = medicineIdWithQuantity;
    return NextResponse.json({ status: true, data: orderObj });
}
