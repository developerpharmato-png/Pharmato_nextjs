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
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    return NextResponse.json({ status: true, data: orders });
}
