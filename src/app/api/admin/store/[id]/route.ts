import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Store from '@/models/Store';

// GET: Get a store by ID
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const { id } = await context.params;
        if (!id) {
            return NextResponse.json({ success: false, message: 'Store ID is required' }, { status: 400 });
        }
        const store = await Store.findById(id)
            .populate('adminManagerId', 'email firstName lastName')
            .lean();
        if (!store) {
            return NextResponse.json({ success: false, message: 'Store not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: store });
    } catch (error: any) {
        console.error('GET /api/admin/store/[id] error:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch store', error: error?.message },
            { status: 500 }
        );
    }
}
  