import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Store from '@/models/Store';
import Pincode from '@/models/Pincode';

// POST /api/admin/store/active
// Body: { pincode?: string, search?: string }
// Returns first active store matching the pincode (exact) or name (regex)
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();
        const { pincode, search, id: storeId, status } = body || {};

        // If request includes `id` and `status`, update status for that store id
        if (storeId && typeof status !== 'undefined') {
            const existingStore: any = await Store.findById(String(storeId)).lean();
            if (!existingStore) {
                return NextResponse.json({ success: false, message: 'Store not found' }, { status: 404 });
            }
            const updated = await Store.findByIdAndUpdate(String(storeId), { status }, { new: true }).lean();
            if (!updated) {
                return NextResponse.json({ success: false, message: 'Store not found' }, { status: 404 });
            }
            const msg = status === 1 ? 'Store activated successfully' : 'Store deactivated successfully';
            return NextResponse.json({ success: true, message: msg, data: { _id: (updated as any)._id, name: (updated as any).name } }, { status: 200 });
        }

        if (pincode) {
            // prefer matching by Pincode doc _id if exists, otherwise try string match
            const pinDoc: any = await Pincode.findOne({ pincode: String(pincode).trim(), isActive: true }).lean();
            const orClauses: any[] = [];
            if (pinDoc && pinDoc._id) {
                orClauses.push({ servicePinCodes: { $in: [pinDoc._id] } });
            }
            // also try raw string match in case servicePinCodes stores strings
            orClauses.push({ servicePinCodes: { $in: [String(pincode).trim()] } });

            const store: any = await Store.findOne({ $or: orClauses, status: 1 }).lean();
            if (!store) {
                return NextResponse.json({ success: false, message: 'No active store found for pincode' }, { status: 404 });
            }
            return NextResponse.json({ success: true, data: { _id: store._id, name: store.name } }, { status: 200 });
        }

        if (search) { 
            const s = String(search).trim();
            const regex = { $regex: s, $options: 'i' };
            const store: any = await Store.findOne({ name: regex, status: 1 }).lean();
            if (!store) {
                return NextResponse.json({ success: false, message: 'No active store found for search' }, { status: 404 });
            }
            return NextResponse.json({ success: true, data: { _id: store._id, name: store.name } }, { status: 200 });
        }

        return NextResponse.json({ success: false, message: 'pincode or search is required' }, { status: 400 });
    } catch (error: any) {
        console.error('POST /api/admin/store/active error:', error);
        return NextResponse.json({ success: false, message: 'Server error', error: error?.message }, { status: 500 });
    }
}
