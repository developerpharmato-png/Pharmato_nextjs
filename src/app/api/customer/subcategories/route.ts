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
 *               storeId:
 *                 type: string
 *                 description: Filter medicine counts by storeId (ObjectId string)
 *                 example: "656e1234abcd5678efgh9012"
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
    const { categoryId, limit = 10, offset = 0, search = "", storeId } = await req.json();
    if (!categoryId) {
        return NextResponse.json({ success: false, error: 'categoryId is required' }, { status: 400 });
    }
    const filter: Record<string, any> = { categoryId, isActive: true };
    if (search) {
        filter["name"] = { $regex: search, $options: "i" };
    }
    const total = await SubCategory.countDocuments(filter);
    const subcategories = await SubCategory.find(filter)
        .skip(offset)
        .limit(limit)
        .lean();
    const Medicine = (await import('@/models/Medicine')).default;
    const subcategoriesWithImages = await Promise.all(subcategories.map(async sub => ({
        ...sub,
        images: Array.isArray(sub.images) ? sub.images : [],
        medicineCount: await Medicine.countDocuments({
            categoryId: sub.categoryId,
            subCategoryId: sub._id,
            isActive: true,
            ...(typeof storeId === 'string' && storeId.trim() !== '' ? { storeId: storeId.trim() } : {})
        })
    })));

    // ...existing code...
    const filteredSubcategories = subcategoriesWithImages.filter(sub => sub.medicineCount > 0);
    return NextResponse.json({
        success: true,
        message: 'Subcategories fetched successfully',
        subcategories: filteredSubcategories,
        total: filteredSubcategories.length,
        limit,
        offset,
        search,
    }, { status: 200 });
}
