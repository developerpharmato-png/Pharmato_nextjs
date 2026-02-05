import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Coupon from '@/models/Coupon'; 

/**
 * @swagger
 * /api/admin/coupon/edit:
 *   post:
 *     summary: Edit an existing coupon
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
 *               code:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [percentage, fixed]
 *               value:
 *                 type: number
 *               maxDiscountAmount:
 *                 type: number
 *               scope:
 *                 type: string
 *                 enum: [global, category, product]
 *               startAt:
 *                 type: string
 *                 format: date-time
 *               endAt:
 *                 type: string
 *                 format: date-time
 *               minOrderValue:
 *                 type: number
 *               totalUses:
 *                 type: integer
 *               perUserLimit:
 *                 type: integer
 *               isStackable:
 *                 type: boolean
 *               isSecret:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Coupon updated
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Coupon not found
 */

export async function POST(request: NextRequest) {
    await dbConnect();
    try {    
        const body = await request.json();
        const { id, ...updateFields } = body;
        if (!id) {
            return NextResponse.json({ success: false, message: 'Coupon id is required' }, { status: 400 });
        }
        const coupon = await Coupon.findByIdAndUpdate(id, updateFields, { new: true });
        if (!coupon) {
            return NextResponse.json({ success: false, message: 'Coupon not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: coupon });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
