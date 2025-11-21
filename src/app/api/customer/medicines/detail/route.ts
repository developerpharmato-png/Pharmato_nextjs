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

    const medicine = await Medicine.findById(id).lean();
    if (!medicine) {
        return NextResponse.json({ error: 'Medicine not found' }, { status: 404 });
    }

    // Populate category and subcategory
    let category = null;
    let subcategory = null;
    if (medicine.categoryId) {
        category = await Category.findById(medicine.categoryId).lean();
    }
    if (medicine.subCategoryId) {
        subcategory = await SubCategory.findById(medicine.subCategoryId).lean();
    }

    return NextResponse.json({ ...medicine, category, subcategory });
}

// Swagger DTO Example
// GET /api/customer/medicines/detail?id=<medicineId>
// Response: { ...medicine, category: {...}, subcategory: {...} }