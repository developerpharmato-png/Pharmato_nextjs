import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Pincode from '@/models/Pincode';

export async function GET(req: NextRequest) {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const pincode = searchParams.get('pincode') || '';
    const sortBy = searchParams.get('sortBy') === 'DESC' ? -1 : 1;

    const filter = pincode ? { pincode: { $regex: pincode, $options: 'i' } } : {};
    const total = await Pincode.countDocuments(filter);
    const pincodes = await Pincode.find(filter)
        .sort({ pincode: sortBy })
        .skip(offset)
        .limit(limit)
        .lean();
    return NextResponse.json({ success: true, data: pincodes, total });
}
