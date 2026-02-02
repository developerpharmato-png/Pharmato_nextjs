import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Coupon from '@/models/Coupon';

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
            return NextResponse.json({ success: false, message: 'id and isActive(boolean) are required' }, { status: 400 });
        }
        const coupon = await Coupon.findByIdAndUpdate(id, { isActive }, { new: true });
        if (!coupon) {
            return NextResponse.json({ success: false, message: 'Coupon not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: coupon });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
