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
 *                 description: Coupon code (optional if couponId is provided)
 *               couponId:
 *                 type: string
 *                 description: Coupon ID (optional if couponCode is provided)
 *               cart:
 *                 type: object
 *                 description: Any cart object (structure may vary)
 *                 additionalProperties: true
 *                 example: {}
 *               isSecretCoupon:
 *                 type: boolean
 *                 description: Set to true if the coupon is a secret coupon (optional)
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
    const { couponCode, couponId, cart, isSecretCoupon } = await request.json();
    if ((!couponCode && !couponId) || !cart) {
        return NextResponse.json({ success: false, message: 'couponCode or couponId and cart are required' }, { status: 400 });
    }
    // Pass both couponCode and couponId to the validator if needed
    const result = await validateAndApplyCoupon(couponCode, cart, couponId, isSecretCoupon);
    return NextResponse.json({
        success: result.discount > 0,
        discount: result.discount,
        eligibleAmount: result.eligibleAmount,
        message: result.message || '',
        coupon: result.coupon || null
    });
}
