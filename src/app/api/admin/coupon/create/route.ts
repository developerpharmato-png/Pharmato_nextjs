import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Coupon from '@/models/Coupon';

/**
 * @swagger
 * /api/admin/coupon/create:
 *   post:
 *     summary: Create a new coupon
 *     tags:
 *       - Admin-Coupon
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 example: DAILYNEEDS
 *               title:
 *                 type: string
 *                 example: 20% Off All Daily OTC
 *               description:
 *                 type: string
 *                 example: Enjoy a fantastic 20% discount on all items from DailyNeeds.
 *               type:
 *                 type: string
 *                 enum: [percentage, fixed]
 *                 example: percentage
 *               value:
 *                 type: number
 *                 example: 20
 *               maxDiscountAmount:
 *                 type: number
 *                 example: 200
 *               scope:
 *                 type: string
 *                 enum: [global, category, product]
 *                 example: global
 *               startAt:
 *                 type: string
 *                 format: date-time
 *                 example: 2025-12-01T00:00:00.000Z
 *               endAt:
 *                 type: string
 *                 format: date-time
 *                 example: 2026-02-24T00:00:00.000Z
 *               minOrderValue:
 *                 type: number
 *                 example: 0
 *               totalUses:
 *                 type: integer
 *                 example: 0
 *               perUserLimit:
 *                 type: integer
 *                 example: 2
 *               isStackable:
 *                 type: boolean
 *                 example: false
 *               isSecret:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Coupon created
 *       400:
 *         description: Invalid input
 */

export async function POST(request: NextRequest) {
    await dbConnect();
    try {
        const body = await request.json();
        // console.log('########body#########',body);

        // Ensure startAt and endAt are Date objects
        if (body.startAt) body.startAt = new Date(body.startAt);
        if (body.endAt) body.endAt = new Date(body.endAt);
        const coupon = await Coupon.create(body);
        return NextResponse.json({ success: true, data: coupon });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
