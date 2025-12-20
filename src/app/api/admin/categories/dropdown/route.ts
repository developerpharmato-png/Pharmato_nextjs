/**
 * GET /api/admin/categories/dropdown
 * Returns categories where `isActive` is true (for dropdowns)
 */
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Category from '@/models/Category';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const categories = await Category.find({ isActive: true })
      .select('name uniqueCode')
      .sort({ name: 1 })
      .lean()
      .exec();

    return NextResponse.json({ success: true, data: categories });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
