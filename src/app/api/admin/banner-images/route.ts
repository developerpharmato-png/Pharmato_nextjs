import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import BannerImage from '@/models/BannerImage';
import Category from '@/models/Category';

// GET: Get the single banner images document
export async function GET() {
    await dbConnect();
    const doc = await BannerImage.findOne().lean();
    if (doc && typeof doc === 'object' && !Array.isArray(doc) && Array.isArray(doc.images)) {
        doc.images = [...doc.images].reverse();
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
