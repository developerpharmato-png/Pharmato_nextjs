import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import BannerImage from '@/models/BannerImage';

// GET: Get the single banner images document
export async function GET() {
    await dbConnect();
    const doc = await BannerImage.findOne().lean();
    return NextResponse.json({ success: true, data: doc });
}

// POST: Update banner images (replace all)
export async function POST(req: NextRequest) {
    await dbConnect();
    const { images } = await req.json();
    if (!Array.isArray(images)) {
        return NextResponse.json({ success: false, message: 'images must be an array of strings' }, { status: 400 });
    }
    let doc = await BannerImage.findOne();
    if (!doc) {
        doc = await BannerImage.create({ images });
    } else {
        doc.images = images;
        await doc.save();
    }
    return NextResponse.json({ success: true, message: 'Banner images updated', data: doc });
}
