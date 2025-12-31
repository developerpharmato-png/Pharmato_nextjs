/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Get all categories
 *     tags:
 *       - Category
 *     responses:
 *       200:
 *         description: List of categories
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
 *                     $ref: '#/components/schemas/Category'
 *   post:
 *     summary: Create a new category
 *     tags:
 *       - Category
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Category'
 *     responses:
 *       201:
 *         description: Category created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 */
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Category from '@/models/Category';

// GET all categories
export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const isOTC = searchParams.get('isOTC');
        const name = searchParams.get('name') || '';
        const limit = parseInt(searchParams.get('limit') || '0', 10);
        const offset = parseInt(searchParams.get('offset') || '0', 10);
        const sortBy = searchParams.get('sortBy') || 'createdAt';
        const sortOrder = searchParams.get('sortOrder') || 'desc';

        let query: any = {};
        if (isOTC !== null) {
            query.isOTC = isOTC === 'true';
        }
        if (name) {
            query.name = { $regex: name, $options: 'i' };
        }

        // Validate sortBy field
        const allowedSortFields = ['name', 'isOTC', 'isActive', 'createdAt', 'updatedAt'];
        const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
        const sortDirection = sortOrder === 'asc' ? 1 : -1;

        let categoriesQuery = Category.find(query).sort({ [sortField]: sortDirection });
        if (offset) categoriesQuery = categoriesQuery.skip(offset);
        if (limit) categoriesQuery = categoriesQuery.limit(limit);

        const categories = await categoriesQuery.exec();

        return NextResponse.json({
            success: true,
            data: categories,
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 400 }
        );
    }
}

// POST create new category
export async function POST(request: NextRequest) {
    try {
        await connectDB();

        const body = await request.json();

        // Treat as list endpoint only when explicit pagination/sort keys are provided
        const isListRequest = (
            body && (
                Object.prototype.hasOwnProperty.call(body, 'limit') ||
                Object.prototype.hasOwnProperty.call(body, 'offset') ||
                Object.prototype.hasOwnProperty.call(body, 'sortBy') ||
                Object.prototype.hasOwnProperty.call(body, 'columnName')
            )
        );

        if (isListRequest) {
            const {
                limit = 10,
                offset = 0,
                sortBy = 'ASC', // ASC | DESC
                columnName = 'createdAt',
                isOTC,
                name = '',
            } = body || {};

            const allowedSortFields = ['name', 'isOTC', 'isActive', 'createdAt', 'updatedAt'];
            const sortField = allowedSortFields.includes(columnName) ? columnName : 'createdAt';
            const sortDirection = String(sortBy).toUpperCase() === 'ASC' ? 1 : -1;

            const query: any = {};
            if (typeof isOTC !== 'undefined' && isOTC !== 'all' && isOTC !== '') {
                // Allow boolean or string values
                query.isOTC = typeof isOTC === 'boolean' ? isOTC : isOTC === 'true';
            }
            // Search across multiple fields: uniqueCode, name, description
            if (name) {
                query.$or = [
                    { uniqueCode: { $regex: name, $options: 'i' } },
                    { name: { $regex: name, $options: 'i' } },
                    { description: { $regex: name, $options: 'i' } }
                ];
            }

            const total = await Category.countDocuments(query);
            let categoriesQuery = Category.find(query)
                .sort({ [sortField]: sortDirection })
                .skip(Number(offset) || 0)
                .limit(Number(limit) || 10);
            const categories = await categoriesQuery.exec();

            return NextResponse.json({ success: true, data: categories, total });
        }

        // Otherwise, create a new category (original behavior)
        const name = (body?.name || '').trim();
        if (!name) {
            return NextResponse.json(
                { success: false, error: 'Category name is required' },
                { status: 400 }
            );
        }

        // Check for duplicate name (case-insensitive)
        const existing = await Category.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });
        if (existing) {
            return NextResponse.json(
                { success: false, error: 'Category already exists' },
                { status: 409 }
            );
        }

        const category = await Category.create({ ...body, name });
        return NextResponse.json({ success: true, data: category }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 400 }
        );
    }
}
