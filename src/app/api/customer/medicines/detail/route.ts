import { NextRequest, NextResponse } from 'next/server';
import Medicine from '@/models/Medicine';
import Category from '@/models/Category';
import SubCategory from '@/models/SubCategory';
import dbConnect from '@/lib/mongodb';

export async function GET(req: NextRequest) {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
        return NextResponse.json({ error: 'Medicine id is required' }, { status: 400 });
    }

    let medicine = await Medicine.findById(id).lean();
    // Defensive: If medicine is an array, take the first element
    if (Array.isArray(medicine)) {
        medicine = medicine[0];
    }
    if (!medicine) {
        return NextResponse.json({ error: 'Medicine not found' }, { status: 404 });
    }

    let category = null;
    let subcategory = null;
    if (medicine && medicine.categoryId) {
        category = await Category.findById(medicine.categoryId).lean();
    }
    if (medicine && medicine.subCategoryId) {
        subcategory = await SubCategory.findById(medicine.subCategoryId).lean();
    }

    return NextResponse.json({ ...medicine, category, subcategory });
}

// Swagger DTO Example
// GET /api/customer/medicines/detail?id=<medicineId>
// Response: { ...medicine, category: {...}, subcategory: {...} }