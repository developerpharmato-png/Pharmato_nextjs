/**
 * @swagger
 * /api/customer/category/price-range:
 *   post:
 *     summary: Get price range for medicines in a category/subcategory
 *     tags:
 *       - Category
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               categoryId:
 *                 type: string
 *               subCategoryId:
 *                 type: string
 *               storeId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Price range computed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 */
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Medicine from '@/models/Medicine';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
    await dbConnect();
    const {
        categoryId,
        subCategoryId,
        storeId = "",
    } = await req.json();

    const matchStage: any = { isActive: true };
    if (categoryId) {
        try {
            matchStage.categoryId = new mongoose.Types.ObjectId(categoryId);
        } catch { }
    }
    if (subCategoryId) {
        try {
            matchStage.subCategoryId = new mongoose.Types.ObjectId(subCategoryId);
        } catch { }
    }
    if (typeof storeId === 'string' && storeId.trim() !== '') {
        try {
            matchStage.storeId = new mongoose.Types.ObjectId(storeId.trim());
        } catch { }
    }

    // Aggregate to compute min and max price
    const agg = [
        { $match: matchStage },
        {
            $group: {
                _id: null,
                minPrice: { $min: { $ifNull: ['$price', 0] } },
                maxPrice: { $max: { $ifNull: ['$price', 0] } },
                count: { $sum: 1 },
            },
        },
    ];

    const res = await Medicine.aggregate(agg);
    const summary = res && res[0] ? res[0] : { minPrice: 0, maxPrice: 0, count: 0 };

    return NextResponse.json({
        status: true,
        priceRange: `${Number(summary.minPrice) || 0},${Number(summary.maxPrice) || 0}`
    });
}
