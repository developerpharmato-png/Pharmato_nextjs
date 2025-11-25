import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Medicine from '@/models/Medicine';

// PUT /api/medicines/update-related
export async function PUT(req: NextRequest) {
    await connectDB();
    const body = await req.json();
    const { medicineId, relatedProductIds } = body;
    if (!medicineId || !Array.isArray(relatedProductIds)) {
        return NextResponse.json({ success: false, message: 'medicineId and relatedProductIds required' }, { status: 400 });
    }
    const updated = await Medicine.findByIdAndUpdate(
        medicineId,
        { relatedProducts: relatedProductIds },
        { new: true }
    );
    if (!updated) {
        return NextResponse.json({ success: false, message: 'Medicine not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Related products updated', data: updated });
}
