/**
 * @swagger
 * /api/customer/coupons:
 *   get:
 *     summary: List all active coupons
 *     tags:
 *       - Coupon
 *     responses:
 *       200:
 *         description: List of active coupons
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 coupons:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Coupon'
 */
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Coupon from '@/models/Coupon';
import moment from 'moment-timezone';

export async function GET(request: NextRequest) {
    await connectDB();
    
        const nowIST = moment().tz("Asia/Kolkata").toDate();
    
        const coupons = await Coupon.find({
            isActive: true,
            isSecret: { $ne: true },
            // startAt: { $lte: nowIST },
            endAt: { $gte: nowIST }
        }).lean();


    // const now = new Date();
    // const coupons = await Coupon.find({
    //     isActive: true,
    //     isSecret: { $ne: true },
    //     // startAt: { $lte: now },
    //     endAt: { $gte: now }
    // }).lean();


    return NextResponse.json({ success: true, coupons });
}
