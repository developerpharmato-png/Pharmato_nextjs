import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';

/**
 * @swagger
 * /api/customer/order/list:
 *   post:
 *     summary: Get list of orders for a customer
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
 *     responses:
 *       200:
 *         description: List of orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Missing or invalid input
 */

export async function POST(req: NextRequest) {
    await dbConnect();
    const { userId } = await req.json();
    if (!userId || typeof userId !== 'string') {
        return NextResponse.json({ status: false, message: 'userId is required' }, { status: 400 });
    }
    const orders = await Order.find({ userId })
        .sort({ createdAt: -1 })
        .populate({
            path: 'medicineId',
            select: '_id name manufacturer mrp price discount images coverImage'
        });

    // Attach quantity to each medicine in medicineId for every order
    const ordersWithQuantities = Array.isArray(orders)
        ? orders.map(order => {
            const medicineQuantities = Array.isArray(order.medicineQuantity) ? order.medicineQuantity : [];
            const medicineIdWithQuantity = Array.isArray(order.medicineId)
                ? order.medicineId.map((med: any) => {
                    const q = medicineQuantities.find((qty: any) => {
                        return (qty.medicineId?.toString && med._id?.toString && qty.medicineId.toString() === med._id.toString());
                    });
                    return {
                        ...med.toObject(),
                        quantity: q?.quantity || 1
                    };
                })
                : [];
            const orderObj = order.toObject();
            orderObj.medicineId = medicineIdWithQuantity;
            return orderObj;
        })
        : [];

    return NextResponse.json({ status: true, data: ordersWithQuantities });
}
