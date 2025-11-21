import { NextRequest, NextResponse } from 'next/server';
import Category from '@/models/Category';
import SubCategory from '@/models/SubCategory';
import dbConnect from '@/lib/mongodb';

export async function POST(req: NextRequest) {
    await dbConnect();
    const { otcOnly = false } = await req.json();

    // Fetch categories based on otcOnly flag
    const categoryFilter = otcOnly ? { isOTC: true } : {};
    const categories = await Category.find(categoryFilter).lean();

    // Fetch subcategories for each category
    const categoryList = await Promise.all(
        categories.map(async (cat: any) => {
            const subcategories = await SubCategory.find({ categoryId: cat._id }).lean();
            return {
                ...cat,
                subcategories,
            };
        })
    );

    return NextResponse.json({ categories: categoryList });
}

// Swagger DTO Example
// Request Body: { "otcOnly": true }
// Response: { "categories": [ { "_id": "...", "name": "...", "isOTC": true, "subcategories": [ ... ] } ] }