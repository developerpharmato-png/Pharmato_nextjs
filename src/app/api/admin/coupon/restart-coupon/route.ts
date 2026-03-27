import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Coupon from '@/models/Coupon';

/**
 * @swagger
 * /api/admin/coupon/restart-coupon:
 *   post:
 *     summary: Reset coupon usage (usedCount and usersOrGuestsUsed)
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
 *     responses:
 *       200:
 *         description: Coupon usage reset
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Coupon not found
 */

export async function POST(request: NextRequest) {
    await connectDB();
    try {
        const body = await request.json();
        const { id } = body;
        if (!id) {
            return NextResponse.json({ success: false, message: 'Coupon id is required' }, { status: 400 });
        }
        const coupon = await Coupon.findByIdAndUpdate(
            id,
            { usedCount: 0, usersOrGuestsUsed: [] },
            { new: true }
        );
        if (!coupon) {
            return NextResponse.json({ success: false, message: 'Coupon not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: coupon });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
