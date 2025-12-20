import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Medicine from '@/models/Medicine';

// GET /api/medicines/by-category/[categoryId]
export async function GET(req: NextRequest, context: { params: Promise<{ categoryId: string }> }) {
    const { categoryId } = await context.params;
    await connectDB();
    const medicines = await Medicine.find({ categoryId, isActive: true }).select('_id name');
    return NextResponse.json({ success: true, data: medicines });
}
