import { NextRequest, NextResponse } from 'next/server';
import Medicine from '@/models/Medicine';
import Category from '@/models/Category';
import SubCategory from '@/models/SubCategory';
import dbConnect from '@/lib/mongodb';

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params;
    await dbConnect();
    if (!id) {
        return NextResponse.json({ success: false, message: 'Medicine id is required', data: null }, { status: 400 });
    }

    let medicine = await Medicine.findById(id).lean();
    // Defensive: If medicine is an array, take the first element
    if (Array.isArray(medicine)) {
        medicine = medicine[0];
    }
    if (!medicine) {
        return NextResponse.json({ success: false, message: 'Medicine not found', data: null }, { status: 404 });
    }

    let category = null;
    let subcategory = null;
    if (medicine && medicine.categoryId) {
        category = await Category.findById(medicine.categoryId).lean();
    }
    if (medicine && medicine.subCategoryId) {
        subcategory = await SubCategory.findById(medicine.subCategoryId).lean();
    }

    return NextResponse.json({ success: true, message: 'Medicine details fetched successfully', data: { ...medicine, category, subcategory } });
}

/**
 * @swagger
 * /api/customer/medicines/detail/{id}:
 *   get:
 *     summary: Get medicine details by ID
 *     tags:
 *       - Medicine
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Medicine MongoDB ID
 *     responses:
 *       200:
 *         description: Medicine details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 category:
 *                   type: object
 *                 subcategory:
 *                   type: object
 *       400:
 *         description: Medicine id is required
 *       404:
 *         description: Medicine not found
 */
