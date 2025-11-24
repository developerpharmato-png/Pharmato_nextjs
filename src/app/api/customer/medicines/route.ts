import { NextRequest, NextResponse } from 'next/server';
import Medicine from '@/models/Medicine';
import dbConnect from '@/lib/mongodb';

export async function POST(req: NextRequest) {
    await dbConnect();
    const { limit = 10, offset = 0, search = "" } = await req.json();

    // Build filter for search
    const filter: Record<string, any> = { isActive: true };
    if (search && search.trim() !== "") {
        filter.name = { $regex: search, $options: "i" };
    }

    // Fetch medicines with pagination
    const medicines = await Medicine.find(filter)
        .skip(offset)
        .limit(limit)
        .lean();

    // Loop and populate category and subcategory details
    const populatedMedicines = await Promise.all(
        medicines.map(async (med: any) => {
            let category = null;
            let subcategory = null;
            if (med.categoryId) {
                const cat = await import('@/models/Category').then(m => m.default.findById(med.categoryId).lean());
                category = cat || null;
            }
            if (med.subCategoryId) {
                const subcat = await import('@/models/SubCategory').then(m => m.default.findById(med.subCategoryId).lean());
                subcategory = subcat || null;
            }
            return {
                ...med,
                category,
                subcategory,
            };
        })
    );

    // Get total count for pagination info
    const total = await Medicine.countDocuments(filter);

    return NextResponse.json({ medicines: populatedMedicines, total }, { status: 200 });
}

// Swagger DTO Example
// Request Body: { "limit": 10, "offset": 0 }
// Response: { "medicines": [ ... ], "total": 100 }