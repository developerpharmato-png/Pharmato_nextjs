import { NextRequest, NextResponse } from 'next/server';
import Category from '@/models/Category';
import SubCategory from '@/models/SubCategory';
import dbConnect from '@/lib/mongodb';

export async function POST(req: NextRequest) {
    await dbConnect();
    const { otcOnly = false, limit = 10, offset = 0, search = "" } = await req.json();

    // Category filter
    let categoryFilter: any = { isActive: true };
    if (typeof otcOnly === 'boolean') {
        categoryFilter.isOTC = otcOnly;
    }
    if (search) {
        categoryFilter.name = { $regex: search, $options: "i" };
    }

    // Get total count for pagination
    const totalCategories = await Category.countDocuments(categoryFilter);
    const categories = await Category.find(categoryFilter)
        .skip(offset)
        .limit(limit)
        .lean();

    // Fetch subcategories for each category with search and pagination
    const categoryList = await Promise.all(
        categories.map(async (cat: any) => {
            const subcategoryFilter: any = { categoryId: cat._id, isActive: true };
            if (search) {
                subcategoryFilter.name = { $regex: search, $options: "i" };
            }
            const subcategories = await SubCategory.find(subcategoryFilter).lean();
            const subcategoriesWithCounts = await Promise.all(subcategories.map(async sub => {
                const count = await (await import('@/models/Medicine')).default.countDocuments({
                    categoryId: cat._id,
                    subCategoryId: sub._id,
                    isActive: true
                });
                return {
                    ...sub,
                    images: Array.isArray(sub.images) ? sub.images : [],
                    medicineCount: count
                };
            }));
            // Only include subcategories with medicineCount > 0
            const filteredSubcategories = subcategoriesWithCounts.filter(sub => sub.medicineCount > 0);
            // Count active medicines for this category
            const medicineCount = await (await import('@/models/Medicine')).default.countDocuments({
                categoryId: cat._id,
                isActive: true
            });
            return {
                ...cat,
                subcategories: filteredSubcategories,
                medicineCount
            };
        })
    );

    // ...existing code...
    const filteredCategoryList = categoryList.filter(cat => cat.medicineCount > 0);
    return NextResponse.json({
        success: true,
        message: 'Categories fetched successfully',
        categories: filteredCategoryList,
        total: filteredCategoryList.length,
        limit,
        offset,
        search,
    }, { status: 200 });
}

/**
 * @swagger
 * /api/customer/categories:
 *   post:
 *     summary: Get paginated category and subcategory list for customers
 *     tags:
 *       - Category
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               otcOnly:
 *                 type: boolean
 *                 description: Filter for OTC categories only
 *                 example: false
 *               limit:
 *                 type: integer
 *                 description: Number of categories to return
 *                 example: 10
 *               offset:
 *                 type: integer
 *                 description: Number of categories to skip
 *                 example: 0
 *               search:
 *                 type: string
 *                 description: Search by category or subcategory name
 *                 example: "Pain"
 *     responses:
 *       200:
 *         description: Paginated category and subcategory list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 categories:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       isOTC:
 *                         type: boolean
 *                       images:
 *                         type: array
 *                         items:
 *                           type: string
 *                       subcategories:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             _id:
 *                               type: string
 *                             name:
 *                               type: string
 *                             description:
 *                               type: string
 *                             isOTC:
 *                               type: boolean
 *                             images:
 *                               type: array
 *                               items:
 *                                 type: string
 *                 total:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 offset:
 *                   type: integer
 *                 search:
 *                   type: string
 */