import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Coupon from '@/models/Coupon';

/**
 * @swagger
 * /api/admin/coupon/check-code:
 *   post:
 *     summary: Check coupon code availability
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
 *     responses:
 *       200:
 *         description: Code availability result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 available:
 *                   type: boolean
 *                 message:
 *                   type: string
 */

export async function POST(request: NextRequest) {
    await dbConnect();
    try {
        const { code } = await request.json();
        if (!code || typeof code !== 'string') {
            return NextResponse.json({ success: false, available: false, message: 'Code is required' }, { status: 400 });
        }
        const exists = await Coupon.exists({ code, isActive: true });
        if (exists) {
            return NextResponse.json({ success: true, available: false, message: 'Code is already taken' });
        }
        return NextResponse.json({ success: true, available: true, message: 'Code is available' });
    } catch (error: any) {
        return NextResponse.json({ success: false, available: false, message: error.message }, { status: 400 });
    }
}
