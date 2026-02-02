import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import BannerImage from '@/models/BannerImage';
import { Types } from 'mongoose';

// POST /api/admin/banner-images/active
// Body: { id: <imageId>, status: 0|1 }
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();
        const { id: imageId, status } = body || {};

        console.log('=== BANNER STATUS UPDATE ===');
        console.log('Received imageId:', imageId, 'status:', status);

        if (!imageId) {
            return NextResponse.json({ success: false, message: 'image id is required' }, { status: 400 });
        }

        // Convert status to boolean
        const newStatus = status === 1 || status === '1' || status === true;
        console.log('New status boolean:', newStatus);

        // Use updateOne with $ positional operator to update the specific array element
        const result = await BannerImage.updateOne(
            { 'images._id': new Types.ObjectId(imageId) },
            { $set: { 'images.$.isActive': newStatus } }
        );

        console.log('UpdateOne result:', result);

        if (result.matchedCount === 0) {
            return NextResponse.json({ success: false, message: 'Image not found' }, { status: 404 });
        }

        // Fetch the updated document to return
        const doc = await BannerImage.findOne();
        
        const msg = newStatus ? 'Banner activated successfully' : 'Banner deactivated successfully';
        return NextResponse.json({ success: true, message: msg, data: { _id: doc._id, images: doc.images } }, { status: 200 });
    } catch (error: any) {
        console.error('POST /api/admin/banner-images/active error:', error);
        return NextResponse.json({ success: false, message: 'Server error', error: error?.message }, { status: 500 });
    }
}
 