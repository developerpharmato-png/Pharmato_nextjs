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

    // Aggregate: Only categories with at least one active medicine
    const categories = await Category.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'medicines',
          localField: '_id',
          foreignField: 'categoryId',
          as: 'medicines',
          pipeline: [{ $match: { isActive: true } }]
        }
      },
      { $addFields: { activeMedicineCount: { $size: '$medicines' } } },
      { $match: { activeMedicineCount: { $gt: 0 } } },
      { $project: { name: 1, uniqueCode: 1, isOTC: 1 } },
      { $sort: { name: 1 } }
    ]);

    return NextResponse.json({ success: true, data: categories });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
