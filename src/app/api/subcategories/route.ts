import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SubCategory from '@/models/SubCategory';
import Category from '@/models/Category';

/**
 * @swagger
 * /api/subcategories:
 *   get:
 *     summary: Get all subcategories
 *     tags:
 *       - SubCategory
 *     parameters:
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
 *                     properties:
 *                       images:
 *                         type: array
 *                         items:
 *                           type: string
 *   post:
 *     summary: Create a new subcategory or list subcategories with filters
 *     tags:
 *       - SubCategory
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - type: object
 *                 description: List subcategories with filters
 *                 properties:
 *                   limit:
 *                     type: number
 *                   offset:
 *                     type: number
 *                   search:
 *                     type: string
 *                   categoryId:
 *                     type: string
 *                   isOTC:
 *                     type: boolean
 *                   sortBy:
 *                     type: string
 *                   columnName:
 *                     type: string
 *               - $ref: '#/components/schemas/SubCategory'
 *     responses:
 *       200:
 *         description: List of subcategories (when using filters)
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
 *                 total:
 *                   type: number
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
        const isOTC = searchParams.get('isOTC');
        const categoryId = searchParams.get('categoryId');

        let query: any = {};
        if (isOTC !== null) {
            query.isOTC = isOTC === 'true';
        }
        if (categoryId) {
            // If categoryId is a valid ObjectId, use directly; otherwise resolve by name
            const isValidObjectId = /^[a-fA-F0-9]{24}$/.test(categoryId);
            if (isValidObjectId) {
                query.categoryId = categoryId;
            } else {
                const categoryDoc = await Category.findOne({ name: categoryId }).select('_id');
                if (!categoryDoc) {
                    return NextResponse.json(
                        { success: false, error: 'Category not found' },
                        { status: 400 }
                    );
                }
                query.categoryId = categoryDoc._id;
            }
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

// POST create new subcategory OR list subcategories with filters
export async function POST(request: NextRequest) {
    try {
        await connectDB();

        const body = await request.json();

        // Check if this is a listing request (has pagination/filter keys)
        const listingKeys = ['limit', 'offset', 'search', 'sortBy', 'columnName'];
        const isListingRequest = listingKeys.some(key => key in body);

        if (isListingRequest) {
            // Handle listing with filters
            const { limit = 10, offset = 0, search, categoryId, isOTC, sortBy = 'desc', columnName = 'createdAt' } = body;

            let query: any = {};

            // Search across multiple fields: uniqueCode, name, description, category name
            if (search) {
                // First find matching category IDs by name
                const matchingCategories = await Category.find({
                    name: { $regex: search, $options: 'i' }
                }).select('_id');
                const matchingCategoryIds = matchingCategories.map(c => c._id);

                query.$or = [
                    { uniqueCode: { $regex: search, $options: 'i' } },
                    { name: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } },
                    { categoryId: { $in: matchingCategoryIds } }
                ];
            }

            // Filter by isOTC
            if (typeof isOTC === 'boolean') {
                query.isOTC = isOTC;
            }

            // Filter by categoryId
            if (categoryId) {
                const isValidObjectId = /^[a-fA-F0-9]{24}$/.test(categoryId);
                if (isValidObjectId) {
                    query.categoryId = categoryId;
                } else {
                    const categoryDoc = await Category.findOne({ name: categoryId }).select('_id');
                    if (!categoryDoc) {
                        return NextResponse.json(
                            { success: false, error: 'Category not found' },
                            { status: 400 }
                        );
                    }
                    query.categoryId = categoryDoc._id;
                }
            }

            // Build sort object
            const sortOrder = sortBy === 'asc' ? 1 : -1;
            const sortField = columnName || 'createdAt';

            const total = await SubCategory.countDocuments(query);
            const subcategories = await SubCategory.find(query)
                .populate('categoryId', 'name isOTC')
                .sort({ [sortField]: sortOrder })
                .skip(offset)
                .limit(limit);

            return NextResponse.json({
                success: true,
                data: subcategories,
                total,
            });
        }

        // Handle create new subcategory
        // Ensure images is always an array
        if (body.images && !Array.isArray(body.images)) {
            body.images = String(body.images).split(',').map((url: string) => url.trim()).filter(Boolean);
        }
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
