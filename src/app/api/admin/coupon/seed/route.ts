/**
 * @swagger
 * /api/admin/coupon/seed:
 *   post:
 *     summary: Insert dummy coupons for testing
 *     tags:
 *       - Coupon
 *     responses:
 *       200:
 *         description: Dummy coupons inserted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 insertedCount:
 *                   type: number
 *                 error:
 *                   type: string
 */
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Coupon from '@/models/Coupon';

export async function POST(request: NextRequest) {
    await connectDB();
    try {
        const dummyCoupons = [
            {
                code: 'DAILYNEEDS',
                title: '20% Off All Daily OTC',
                description: 'Enjoy a fantastic 20% discount on all items from DailyNeeds.',
                type: 'percentage',
                value: 20,
                maxDiscountAmount: 200,
                scope: 'global',
                includedCategoryIds: ['daily-otc-category-id'],
                startAt: new Date('2025-12-01'),
                endAt: new Date('2026-02-24'),
                minOrderValue: 0,
                totalUses: null,
                perUserLimit: 2,
                isActive: true,
                isStackable: false
            },
            {
                code: 'DIWALI',
                title: '20% Off All Medicines',
                description: 'Enjoy a fantastic 20% discount on all medicine items from our store.',
                type: 'percentage',
                value: 20,
                maxDiscountAmount: 300,
                scope: 'global',
                startAt: new Date('2025-12-01'),
                endAt: new Date('2026-02-24'),
                minOrderValue: 200,
                totalUses: 10000,
                perUserLimit: 1,
                isActive: true,
                isStackable: false
            }
        ];
        const result = await Coupon.insertMany(dummyCoupons, { ordered: false });
        return NextResponse.json({ success: true, insertedCount: result.length });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
