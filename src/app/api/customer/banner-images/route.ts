import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import BannerImage from '@/models/BannerImage';

/**
 * @swagger
 * /api/customer/banner-images:
 *   get:
 *     summary: Get banner images for customer
 *     tags:
 *       - Customer
 *     responses:
 *       200:
 *         description: Banner images fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 images:
 *                   type: array
 *                   items:
 *                     type: string
 */

export async function GET() {
    await dbConnect();
    const doc = await BannerImage.findOne().lean();
    let images: any[] = [];
    if (doc && !Array.isArray(doc) && 'images' in doc && Array.isArray(doc.images)) {
        const activeImages = doc.images.filter((img: any) => img.isActive === true);
        images = await Promise.all(activeImages.map(async (img: any) => {
            let categoryActive = false;
            let subcategoryAvailable = false;
            let medicineCount = 0;
            let categoryName = '';
            if (img.targetId) {
                const categoryDoc = await (await import('@/models/Category')).default.findOne({ _id: img.targetId, isActive: true }).lean();
                if (categoryDoc && !Array.isArray(categoryDoc) && categoryDoc._id) {
                    categoryActive = true;
                    categoryName = categoryDoc.name || '';
                    const subcategoryDoc = await (await import('@/models/SubCategory')).default.findOne({ categoryId: categoryDoc._id, isActive: true }).lean();
                    if (subcategoryDoc && !Array.isArray(subcategoryDoc) && subcategoryDoc._id) {
                        subcategoryAvailable = true;
                        // Count active medicines for this category and subcategory
                        medicineCount = await (await import('@/models/Medicine')).default.countDocuments({
                            categoryId: categoryDoc._id,
                            subCategoryId: subcategoryDoc._id,
                            isActive: true
                        });
                    } else {
                        // No active subcategory, count medicines by category only
                        medicineCount = await (await import('@/models/Medicine')).default.countDocuments({
                            categoryId: categoryDoc._id,
                            isActive: true
                        });
                    }
                }
            }
            return {
                url: img.url,
                alt: img.alt || '',
                targetScreen: img.targetScreen || '',
                targetId: img.targetId || '',
                categoryActive,
                subcategoryAvailable,
                medicineCount,
                categoryName,
                webImage: img.webImage || ''
            };
        }));
    }
    return NextResponse.json({
        success: true,
        message: 'Banner images fetched successfully',
        images: images.map(img => ({
            ...img,
            categoryName: img.categoryName || ''
        }))
    });
}
