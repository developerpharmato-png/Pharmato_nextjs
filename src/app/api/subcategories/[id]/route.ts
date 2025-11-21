import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SubCategory from '@/models/SubCategory';

/**
 * @swagger
 * /api/subcategories/{id}:
 *   get:
 *     summary: Get subcategory by ID
 *     tags:
 *       - SubCategory
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Subcategory ID
 *     responses:
 *       200:
 *         description: Subcategory details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/SubCategory'
 *   put:
 *     summary: Update subcategory by ID
 *     tags:
 *       - SubCategory
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Subcategory ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SubCategory'
 *     responses:
 *       200:
 *         description: Subcategory updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/SubCategory'
 *   delete:
 *     summary: Delete subcategory by ID
 *     tags:
 *       - SubCategory
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Subcategory ID
 *     responses:
 *       200:
 *         description: Subcategory deleted
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

// GET single subcategory
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const params = await context.params;
        const subcategory = await SubCategory.findById(params.id)
            .populate('categoryId', 'name isOTC');
        if (!subcategory) {
            return NextResponse.json(
                { success: false, error: 'Subcategory not found', debugId: params.id },
                { status: 404 }
            );
        }
        return NextResponse.json({
            success: true,
            data: subcategory,
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 400 }
        );
    }
}

// PUT update subcategory
export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const params = await context.params;
        const body = await request.json();
        const subcategory = await SubCategory.findByIdAndUpdate(
            params.id,
            body,
            { new: true, runValidators: true }
        ).populate('categoryId', 'name isOTC');
        if (!subcategory) {
            return NextResponse.json(
                { success: false, error: 'Subcategory not found', debugId: params.id },
                { status: 404 }
            );
        }
        return NextResponse.json({
            success: true,
            data: subcategory,
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 400 }
        );
    }
}

// DELETE subcategory
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const params = await context.params;
        const subcategory = await SubCategory.findByIdAndDelete(params.id);
        if (!subcategory) {
            return NextResponse.json(
                { success: false, error: 'Subcategory not found', debugId: params.id },
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
