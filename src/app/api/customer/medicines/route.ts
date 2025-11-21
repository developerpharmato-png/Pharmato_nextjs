import { NextRequest, NextResponse } from 'next/server';
import Medicine from '@/models/Medicine';
import dbConnect from '@/lib/mongodb';

export async function POST(req: NextRequest) {
    await dbConnect();
    const { limit = 10, offset = 0 } = await req.json();

    // Fetch medicines with pagination
    const medicines = await Medicine.find({ isActive: true })
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
    const total = await Medicine.countDocuments({ isActive: true });

    return NextResponse.json({ medicines: populatedMedicines, total });
}

// Swagger DTO Example
// Request Body: { "limit": 10, "offset": 0 }
// Response: { "medicines": [ ... ], "total": 100 }