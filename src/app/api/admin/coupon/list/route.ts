import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Coupon from '@/models/Coupon';

/**
 * @swagger
 * /api/admin/coupon/list:
 *   post:
 *     summary: Get coupons with search and pagination
 *     tags:
 *       - Admin-Coupon
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
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
        const { search = '', limit = 10, offset = 0 } = body;
        const skip = (Number(offset) - 1) * Number(limit);
        const query: any = {};
        if (search && search.trim() !== '') {
            query.$or = [
                { code: { $regex: search, $options: 'i' } },
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        const coupons = await Coupon.find(query)
            .sort({ createdAt: -1 })
            .skip(Number(skip))
            .limit(Number(limit));
        const total = await Coupon.countDocuments(query);
        return NextResponse.json({ success: true, data: coupons, total });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
