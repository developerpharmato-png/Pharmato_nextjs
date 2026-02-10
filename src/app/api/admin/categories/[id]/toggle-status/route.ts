import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Category from '@/models/Category';
import BannerImage from '@/models/BannerImage';
import Medicine from '@/models/Medicine';

// PATCH - Toggle category active/inactive status
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();

        const { id } = await params;

        const category = await Category.findById(id);
        if (!category) {
            return NextResponse.json(
                { success: false, error: 'Category not found' },
                { status: 404 }
            );
        }

        if (category.isActive) {

            // Check if any medicine exists for this category
            const medicineExists = await Medicine.exists({ categoryId: category._id , isActive : true });
            if (medicineExists) {
                return NextResponse.json(
                    {
                        success: false,
                        message: 'This category contains active medicines and cannot be deactivated.'
                    },
                    { status: 400 }
                );
            }

        }

        // Toggle the isActive status
        category.isActive = !category.isActive;
        await category.save();

        if (category.isActive === false) {
            try {
                const targetIdStr = String(category._id);

                // Find BannerImage documents that contain images with matching targetId
                const bannerDocs = await BannerImage.find({ 'images.targetId': { $in: [category._id, targetIdStr] } });

                for (const doc of bannerDocs) {
                    for (const img of doc.images as any[]) {
                        if (!img) continue;
                        const t = img.targetId;

                        if (t == targetIdStr || (t && t.toString && t.toString() === targetIdStr)) {

                            await BannerImage.updateOne(
                                {
                                    _id: doc._id,
                                    'images.targetId': targetIdStr
                                },
                                {
                                    $set: {
                                        'images.$.isActive': false
                                    }
                                }
                            );

                        }

                    }

                }

                console.log('Banner images deactivated for category:', targetIdStr);
            } catch (err) {
                console.error('Failed updating BannerImage items for category:', err);
            }
        }

        return NextResponse.json({
            success: true,
            data: category,
            message: `Category ${category.isActive ? 'activated' : 'deactivated'} successfully`,
        });

    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 400 }
        );
    }
}
