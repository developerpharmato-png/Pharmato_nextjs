

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Medicine from '@/models/Medicine';

// POST /api/medicines/by-category/[categoryId]
export async function POST(req: NextRequest, context: { params: Promise<{ categoryId: string }> }) {
    const { categoryId } = await context.params;
    await connectDB();
    const body = await req.json();
    const search = body.search || "";

    let query: any = { isActive: true };
    if (categoryId && categoryId !== 'all') {
        query.categoryId = categoryId;
    }
    if (search) {
        query.name = { $regex: search, $options: 'i' };
    }

    const medicines = await Medicine.find(query).select('_id name');
    return NextResponse.json({ success: true, data: medicines });
}
