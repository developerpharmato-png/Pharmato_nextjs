import { NextRequest, NextResponse } from 'next/server';
import SubCategory from '@/models/SubCategory';
import dbConnect from '@/lib/mongodb';

/**
 * @swagger
 * /api/customer/subcategories:
 *   post:
 *     summary: Get subcategory list for a category (customer)
 *     tags:
 *       - SubCategory
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               categoryId:
 *                 type: string
 *                 description: Category ID to filter subcategories
 *                 example: "CATEGORY_OBJECT_ID"
 *     responses:
 *       200:
 *         description: List of subcategories for the category
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 subcategories:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       isOTC:
 *                         type: boolean
 *                       images:
 *                         type: array
 *                         items:
 *                           type: string
 */

export async function POST(req: NextRequest) {
    await dbConnect();
    const { categoryId, limit = 10, offset = 0, search = "" } = await req.json();
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
    }
    if (!categoryId) {
        return NextResponse.json({ success: false, error: 'categoryId is required' }, { status: 400, headers: corsHeaders });
    }
    const filter: Record<string, any> = { categoryId };
    if (search) {
        filter["name"] = { $regex: search, $options: "i" };
    }
    const total = await SubCategory.countDocuments(filter);
    const subcategories = await SubCategory.find(filter)
        .skip(offset)
        .limit(limit)
        .lean();
    const subcategoriesWithImages = subcategories.map(sub => ({
        ...sub,
        images: Array.isArray(sub.images) ? sub.images : [],
    }));
    return NextResponse.json({
        success: true,
        message: 'Subcategories fetched successfully',
        subcategories: subcategoriesWithImages,
        total,
        limit,
        offset,
        search,
    }, { status: 200, headers: corsHeaders });
}
