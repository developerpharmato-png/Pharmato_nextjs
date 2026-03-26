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
 *               cart:
 *                 type: object
 *                 description: Any cart object (structure may vary)
 *                 additionalProperties: true
 *                 example: {}
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
    const { couponCode, cart } = await request.json();
    if (!couponCode || !cart) {
        return NextResponse.json({ success: false, message: 'couponCode and cart are required' }, { status: 400 });
    }
    const result = await validateAndApplyCoupon(couponCode, cart);
    return NextResponse.json({
        success: result.discount > 0,
        discount: result.discount,
        eligibleAmount: result.eligibleAmount,
        message: result.message || '',
        coupon: result.coupon || null
    });
}
