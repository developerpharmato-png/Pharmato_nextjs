import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Medicine from '@/models/Medicine';

// PUT /api/medicines/update-cross-sell
export async function PUT(req: NextRequest) {
    await connectDB();
    const body = await req.json();
    const { medicineId, crossSellProductIds } = body;
    if (!medicineId || !Array.isArray(crossSellProductIds)) {
        return NextResponse.json({ success: false, message: 'medicineId and crossSellProductIds required' }, { status: 400 });
    }
    const updated = await Medicine.findByIdAndUpdate(
        medicineId,
        { crossSellProducts: crossSellProductIds },
        { new: true }
    );
    if (!updated) {
        return NextResponse.json({ success: false, message: 'Medicine not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Cross-sell products updated', data: updated });
}
