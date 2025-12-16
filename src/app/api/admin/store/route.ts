import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Store from '@/models/Store';
import Pincode from '@/models/Pincode';

// POST: List all stores (with search and filters in body)
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();
        const { search = '', isListRequest = false } = body;

        // If this is a list request (not a create request)
        if (isListRequest) {
            const searchTrim = search.trim();
            let query: any = {};
            if (searchTrim) {
                const regex = { $regex: searchTrim, $options: 'i' };
                query = { $or: [{ name: regex }, { servicePinCodes: regex }] };
            }

            const stores = await Store.find(query)
                .populate('adminManagerId', 'email firstName lastName')
                .lean()
                .exec();
            return NextResponse.json({ success: true, message: 'Stores fetched successfully', data: stores });
        }

        // Otherwise, create a new store
        const { name, servicePinCodes, address, status, adminManagerId } = body;
        if (!name || typeof name !== 'string') {
            return NextResponse.json({ success: false, message: 'Store name is required' }, { status: 400 });
        }
        const store = await Store.create({ name, servicePinCodes, address, status, adminManagerId });
        const populatedStore = await Store.findById(store._id).populate('adminManagerId', 'email firstName lastName');
        return NextResponse.json({ success: true, message: 'Store added successfully', data: populatedStore }, { status: 201 });
    } catch (error: any) {
        console.error('POST /api/admin/store error:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to process request', error: error?.message },
            { status: 500 }
        );
    }
}

// PUT: Update a store by ID
export async function PUT(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) {
            return NextResponse.json({ success: false, message: 'Store ID is required' }, { status: 400 });
        }
        const { name, servicePinCodes, address, status, adminManagerId } = await req.json();
        const updated = await Store.findByIdAndUpdate(
            id,
            { name, servicePinCodes, address, status, adminManagerId },
            { new: true }
        ).populate('adminManagerId', 'email firstName lastName');
        if (!updated) {
            return NextResponse.json({ success: false, message: 'Store not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, message: 'Store updated successfully', data: updated });
    } catch (error: any) {
        console.error('PUT /api/admin/store error:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to update store', error: error?.message },
            { status: 500 }
        );
    }
}
