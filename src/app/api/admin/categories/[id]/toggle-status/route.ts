import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Category from '@/models/Category';

// PATCH - Toggle category active/inactive status
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();

        const { id } = await params;
        const category = await Category.findById(id);

        if (!category) {
            return NextResponse.json(
                { success: false, error: 'Category not found' },
                { status: 404 }
            );
        }

        // Toggle the isActive status
        category.isActive = !category.isActive;
        await category.save();

        return NextResponse.json({
            success: true,
            data: category,
            message: `Category ${category.isActive ? 'activated' : 'deactivated'} successfully`,
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 400 }
        );
    }
}
