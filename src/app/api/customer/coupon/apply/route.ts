/**
 * @swagger
 * /api/customer/coupon/apply:
 *   post:
 *     summary: Validate and apply a coupon to the user's cart
 *     tags:
 *       - Coupon
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               couponCode:
 *                 type: string
 *               userId:
 *                 type: string
 *               cart:
 *                 type: object
 *                 properties:
 *                   items:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         medicineId:
 *                           type: string
 *                         categoryId:
 *                           type: string
 *                         price:
 *                           type: number
 *                         quantity:
 *                           type: number
 *                   total:
 *                     type: number
 *     responses:
 *       200:
 *         description: Coupon validation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 discount:
 *                   type: number
 *                 eligibleAmount:
 *                   type: number
 *                 reason:
 *                   type: string
 *                 coupon:
 *                   type: object
 */
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { validateAndApplyCoupon } from '@/models/validateAndApplyCoupon';

export async function POST(request: NextRequest) {
    await connectDB();
    const { couponCode, userId, cart } = await request.json();
    if (!couponCode || !userId || !cart) {
        return NextResponse.json({ success: false, reason: 'couponCode, userId, and cart are required' }, { status: 400 });
    }
    const result = await validateAndApplyCoupon(couponCode, userId, cart);
    return NextResponse.json({
        success: result.discount > 0,
        discount: result.discount,
        eligibleAmount: result.eligibleAmount,
        reason: result.reason || '',
        coupon: result.coupon || null
    });
}
