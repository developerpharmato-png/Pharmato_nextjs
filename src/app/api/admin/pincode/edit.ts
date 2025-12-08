import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Pincode from '@/models/Pincode';

export async function PUT(req: NextRequest) {
    await dbConnect();
    const { id, pincode, isActive } = await req.json();
    if (!id) {
        return NextResponse.json({ success: false, message: 'id is required' }, { status: 400 });
    }
    if (!pincode || typeof pincode !== 'string') {
        return NextResponse.json({ success: false, message: 'pincode is required' }, { status: 400 });
    }
    const pin = await Pincode.findByIdAndUpdate(id, { pincode, isActive }, { new: true });
    if (!pin) {
        return NextResponse.json({ success: false, message: 'Pincode not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: pin });
}
