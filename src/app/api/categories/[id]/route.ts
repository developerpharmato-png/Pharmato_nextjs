import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Category from '@/models/Category';
import SubCategory from '@/models/SubCategory';

/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     summary: Get category by ID
 *     tags:
 *       - Category
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *   put:
 *     summary: Update category by ID
 *     tags:
 *       - Category
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Category'
 *     responses:
 *       200:
 *         description: Category updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *   delete:
 *     summary: Delete category by ID
 *     tags:
 *       - Category
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 */

// GET single category
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const params = await context.params;
        console.log('Category GET API called with id:', params.id);
        const category = await Category.findById(params.id);
        if (!category) {
            console.log('Category not found for id:', params.id);
            return NextResponse.json(
                { success: false, error: 'Category not found', debugId: params.id },
                { status: 404 }
            );
        }
        // Get subcategories count
        const subCategoriesCount = await SubCategory.countDocuments({ categoryId: params.id });
        return NextResponse.json({
            success: true,
            data: {
                ...category.toObject(),
                subCategoriesCount,
            },
        });
    } catch (error: any) {
        console.log('Error in Category GET API:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 400 }
        );
    }
}

// PUT update category
export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const params = await context.params;
        const body = await request.json();
        console.log('Category PUT API called with id:', params.id);
        const category = await Category.findByIdAndUpdate(
            params.id,
            body,
            { new: true, runValidators: true }
        );
        if (!category) {
            console.log('Category not found for id:', params.id);
            return NextResponse.json(
                { success: false, error: 'Category not found', debugId: params.id },
                { status: 404 }
            );
        }
        return NextResponse.json({
            success: true,
            data: category,
        });
    } catch (error: any) {
        console.log('Error in Category PUT API:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 400 }
        );
    }
}

// DELETE category
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const params = await context.params;
        // Check if category has subcategories
        const subCategoriesCount = await SubCategory.countDocuments({ categoryId: params.id });
        if (subCategoriesCount > 0) {
            return NextResponse.json(
                { success: false, error: 'Cannot delete category with existing subcategories' },
                { status: 400 }
            );
        }
        const category = await Category.findByIdAndDelete(params.id);
        if (!category) {
            return NextResponse.json(
                { success: false, error: 'Category not found', debugId: params.id },
                { status: 404 }
            );
        }
        return NextResponse.json({
            success: true,
            data: {},
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 400 }
        );
    }
}
