import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Pincode from '@/models/Pincode';

// GET: List all pincodes
export async function GET() {
    await dbConnect();
    const pincodes = await Pincode.find().lean();
    return NextResponse.json({ success: true, data: pincodes });
}

// POST: Add a new pincode
export async function POST(req: NextRequest) {
    await dbConnect();
    const { pincode, isActive = true } = await req.json();
    if (!pincode || typeof pincode !== 'string') {
        return NextResponse.json({ success: false, message: 'pincode is required' }, { status: 400 });
    }
    const exists = await Pincode.findOne({ pincode });
    if (exists) {
        return NextResponse.json({ success: false, message: 'Pincode already exists' }, { status: 409 });
    }
    const pin = await Pincode.create({ pincode, isActive });
    return NextResponse.json({ success: true, data: pin });
}

// PUT: Update a pincode
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

// DELETE: Delete a pincode
export async function DELETE(req: NextRequest) {
    await dbConnect();
    const { id } = await req.json();
    if (!id) {
        return NextResponse.json({ success: false, message: 'id is required' }, { status: 400 });
    }
    const pin = await Pincode.findByIdAndDelete(id);
    if (!pin) {
        return NextResponse.json({ success: false, message: 'Pincode not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Pincode deleted' });
}
