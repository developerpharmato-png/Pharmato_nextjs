import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import BannerImage from '@/models/BannerImage';
import Category from '@/models/Category';

// GET: Get the single banner images document
export async function GET() {
    await dbConnect();
    const doc = await BannerImage.findOne().lean();
    if (doc && typeof doc === 'object' && !Array.isArray(doc) && Array.isArray(doc.images)) {
        // Prefer explicit createdAt on image objects when available
        const hasCreatedAt = doc.images.some((img: any) => img && img.createdAt);
        if (hasCreatedAt) {
            doc.images = doc.images.slice().sort((a: any, b: any) => {
                const ta = a && a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const tb = b && b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return tb - ta; // newest first
            });
        } else {
            // Fallback: sort by ObjectId timestamp (newest first)
            const idToTs = (id: any) => {
                try {
                    const s = String(id || "");
                    if (s.length >= 8) {
                        return parseInt(s.substring(0, 8), 16) * 1000;
                    }
                } catch (e) {}
                return 0;
            };
            doc.images = doc.images.slice().sort((a: any, b: any) => idToTs(b._id) - idToTs(a._id));
        }
    }
    return NextResponse.json({ success: true, data: doc });
}

// POST: Update banner images (replace all)
export async function POST(req: NextRequest) {
    await dbConnect();
    const { images } = await req.json();

    if (!Array.isArray(images)) {
        return NextResponse.json({ success: false, message: 'images must be an array of strings' }, { status: 400 });
    }

    try {

        for (const image of images) {

            const targetId = image.targetId;

            const category = await Category.findById(targetId);

            console.log(category);

            if (image.isActive) {

                if (category && !category.isActive) {
                    return NextResponse.json({ success: false, message: `category ${category.name} is not active` }, { status: 400 });
                }

            }

        }

        let doc = await BannerImage.findOne();
        if (!doc) {
            doc = await BannerImage.create({ images });
        } else {
            doc.images = images;
            await doc.save();
        }
        return NextResponse.json({ success: true, message: 'Banner images updated', data: doc });



    } catch (error) {
        console.error('Error updating banner images:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });

    }

}
