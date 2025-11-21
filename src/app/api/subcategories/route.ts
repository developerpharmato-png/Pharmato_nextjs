import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SubCategory from '@/models/SubCategory';

/**
 * @swagger
 * /api/subcategories:
 *   get:
 *     summary: Get all subcategories
 *     tags:
 *       - SubCategory
 *     parameters:
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *       - in: query
 *         name: isOTC
 *         schema:
 *           type: boolean
 *         description: Filter by OTC status
 *     responses:
 *       200:
 *         description: List of subcategories
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SubCategory'
 *   post:
 *     summary: Create a new subcategory
 *     tags:
 *       - SubCategory
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SubCategory'
 *     responses:
 *       201:
 *         description: Subcategory created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/SubCategory'
 */

// GET all subcategories
export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const categoryId = searchParams.get('categoryId');
        const isOTC = searchParams.get('isOTC');

        let query: any = {};
        if (categoryId) {
            query.categoryId = categoryId;
        }
        if (isOTC !== null) {
            query.isOTC = isOTC === 'true';
        }

        const subcategories = await SubCategory.find(query)
            .populate('categoryId', 'name isOTC')
            .sort({ createdAt: -1 });

        return NextResponse.json({
            success: true,
            data: subcategories,
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 400 }
        );
    }
}

// POST create new subcategory
export async function POST(request: NextRequest) {
    try {
        await connectDB();

        const body = await request.json();
        const subcategory = await SubCategory.create(body);

        const populatedSubCategory = await SubCategory.findById(subcategory._id)
            .populate('categoryId', 'name isOTC');

        return NextResponse.json({
            success: true,
            data: populatedSubCategory,
        }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 400 }
        );
    }
}
