import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import BannerImage from '@/models/BannerImage';

// POST /api/admin/banner-images/active
// Body: { id: <imageId>, status: 0|1 }
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();
        const { id: imageId, status } = body || {};

        if (!imageId) {
            return NextResponse.json({ success: false, message: 'image id is required' }, { status: 400 });
        }

        // There's a single BannerImage document that contains images array.
        const doc = await BannerImage.findOne();
        if (!doc) {
            return NextResponse.json({ success: false, message: 'Banner images not found' }, { status: 404 });
        }

        const img = doc.images.id(imageId) as any;
        if (!img) {
            return NextResponse.json({ success: false, message: 'Image not found' }, { status: 404 });
        }

        img.isActive = !!status;
        await doc.save();

        const msg = img.isActive ? 'Banner activated successfully' : 'Banner deactivated successfully';
        return NextResponse.json({ success: true, message: msg, data: { _id: img._id, isActive: img.isActive } }, { status: 200 });
    } catch (error: any) {
        console.error('POST /api/admin/banner-images/active error:', error);
        return NextResponse.json({ success: false, message: 'Server error', error: error?.message }, { status: 500 });
    }
}
