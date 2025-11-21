import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SubCategory from '@/models/SubCategory';

// PATCH - Toggle subcategory active/inactive status
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();

        const { id } = await params;
        const subcategory = await SubCategory.findById(id);

        if (!subcategory) {
            return NextResponse.json(
                { success: false, error: 'Subcategory not found' },
                { status: 404 }
            );
        }

        // Toggle the isActive status
        subcategory.isActive = !subcategory.isActive;
        await subcategory.save();

        return NextResponse.json({
            success: true,
            data: subcategory,
            message: `Subcategory ${subcategory.isActive ? 'activated' : 'deactivated'} successfully`,
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 400 }
        );
    }
}
