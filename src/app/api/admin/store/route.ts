import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Store from '@/models/Store';
import Pincode from '@/models/Pincode';

// GET: List all stores
export async function GET() {
    await dbConnect();
    const stores = await Store.find().lean();
    return NextResponse.json({ success: true, message: 'Stores fetched successfully', data: stores });
}

// POST: Add a new store
export async function POST(req: NextRequest) {
    await dbConnect();
    const { name, servicePinCodes, address, status } = await req.json();
    if (!name || typeof name !== 'string') {
        return NextResponse.json({ success: false, message: 'Store name is required' }, { status: 400 });
    }
    const store = await Store.create({ name, servicePinCodes, address, status });
    return NextResponse.json({ success: true, message: 'Store added successfully', data: store });
}

// PUT: Update a store by ID
export async function PUT(req: NextRequest) {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
        return NextResponse.json({ success: false, message: 'Store ID is required' }, { status: 400 });
    }
    const { name, servicePinCodes, address, status } = await req.json();
    const updated = await Store.findByIdAndUpdate(id, { name, servicePinCodes, address, status }, { new: true });
    if (!updated) {
        return NextResponse.json({ success: false, message: 'Store not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Store updated successfully', data: updated });
}
