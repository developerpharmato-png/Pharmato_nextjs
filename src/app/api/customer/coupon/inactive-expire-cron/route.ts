import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Coupon from '@/models/Coupon';

/**
 * @swagger
 * /api/customer/coupon/inactive-expire-cron:
 *   post:
 *     summary: Inactivate all expired coupons
 *     tags:
 *       - Coupon
 *     description: Sets isActive=false for all coupons whose endAt is in the past and are currently active.
 *     responses:
 *       200:
 *         description: Expired coupons inactivated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 message:
 *                   type: string
 *             example:
 *               success: true
 *               count: 5
 *               message: 5 expired coupons inactivated
 */
export async function POST() {
    await connectDB();
    const now = new Date();
    const result = await Coupon.updateMany(
        { endAt: { $lt: now }, isActive: true },
        { $set: { isActive: false } }
    );
    return NextResponse.json({
        success: true,
        count: result.modifiedCount,
        message: `${result.modifiedCount} expired coupons inactivated`,
    });
}
