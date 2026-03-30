import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Coupon from '@/models/Coupon';
import moment from 'moment-timezone';

/**
 * @swagger
 * /api/admin/coupon/status:
 *   post:
 *     summary: Update coupon active/inactive status
 *     tags:
 *       - Admin-Coupon
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 description: Coupon ObjectId
 *               isActive:
 *                 type: boolean
 *                 description: Set true for active, false for inactive
 *     responses:
 *       200:
 *         description: Coupon status updated
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Coupon not found
 */

export async function POST(request: NextRequest) {
    await dbConnect();
    try {
        const { id, isActive } = await request.json();
        if (!id || typeof isActive !== 'boolean') {
            return NextResponse.json({ success: false, message: 'id and isActive(boolean) are required' }, { status: 200 });
        }

        // Find the coupon by id to get its code
        const currentCoupon = await Coupon.findById(id);
        if (!currentCoupon) {
            return NextResponse.json({ success: false, message: 'Coupon not found' }, { status: 200 });
        }

        const nowIST = moment().tz("Asia/Kolkata").toDate();

        const checkCouponExpiredOrExhousted = await Coupon.findOne({
            _id: id,
            $or: [
                { endAt: { $lt: nowIST } },
                { $expr: { $gte: ["$usedCount", "$totalUses"] } }
            ]
        });

        if (checkCouponExpiredOrExhousted) {
            return NextResponse.json({ success: false, message: 'Cannot activate an expired or fully used coupon.' }, { status: 200 });
        }

        // If activating, check for another active coupon with the same code but different id
        if (isActive) {
            const duplicate = await Coupon.findOne({ code: currentCoupon.code, isActive: true, _id: { $ne: id } });
            if (duplicate) {
                return NextResponse.json({ success: false, message: 'Another active coupon with the same code exists.' }, { status: 200 });
            }
        }

        const coupon = await Coupon.findByIdAndUpdate(id, { isActive }, { new: true });
        return NextResponse.json({ success: true, message: `Coupon has been ${isActive ? 'activated' : 'deactivated'}.` });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
