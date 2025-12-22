import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Pincode from '@/models/Pincode';

/**
 * GET /api/admin/pincode/active-list
 * Returns pincodes where isActive === true for dropdowns
 */
export async function GET() {
    await dbConnect();
    const pincodes = await Pincode.find({ isActive: true })
        .select('_id pincode')
        .sort({ pincode: 1 })
        .lean();
    return NextResponse.json({ success: true, data: pincodes });
}
