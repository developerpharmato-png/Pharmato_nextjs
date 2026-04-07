import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Coupon from '@/models/Coupon';
import Order from '@/models/Order';

/**
 * @swagger
 * /api/admin/coupon/order-used-list:
 *   post:
 *     summary: Get order-used coupon list with search and pagination
 *     tags:
 *       - Admin-Coupon
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               couponId:
 *                 type: string
 *                 description: Coupon ObjectId
 *               search:
 *                 type: string
 *                 example: "DAILYNEEDS"
 *               limit:
 *                 type: integer
 *                 example: 10
 *               offset:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: List of coupons
 *       400:
 *         description: Error fetching coupons
 */

export async function POST(request: NextRequest) {
    await dbConnect();
    try {
        const body = await request.json();
        const { couponId, search = '', limit = 10, offset = 0 } = body;
        const skip = (Number(offset) - 1) * Number(limit);
        const query: any = {};

        if (couponId) {
            query["calculationData.couponId"] = couponId;
        }

        if (search && search.trim() !== '') {
            query["calculationData.couponCode"] = search.trim();
        }

        const orders = await Order.find(query)
            .select('_id order_id calculationData total_order_amount order_status deliveredAddress createdAt')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(10)
            .lean();

        const totalCount = await Order.countDocuments({
            ["calculationData.couponId"]: couponId
        });

        return NextResponse.json({ success: true, data: orders, total: totalCount });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
