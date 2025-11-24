import { NextRequest, NextResponse } from 'next/server';
import Medicine from '@/models/Medicine';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
    await dbConnect();
    const {
        categoryId,
        subCategoryId,
        limit = 10,
        offset = 0,
        manufacturer,
        minPrice = 0,
        maxPrice,
        search,
        sortBy,
        columnName
    } = await req.json();

    // Set defaults if empty or invalid
    const sortField = columnName && columnName.trim() !== '' ? columnName : 'createdAt';
    const sortOrder = sortBy && sortBy.trim().toUpperCase() === 'ASC' ? 1 : -1;

    const matchStage: any = {
        isActive: true
    };

    if (categoryId) {
        matchStage.categoryId = new mongoose.Types.ObjectId(categoryId);
    }
    if (subCategoryId) {
        matchStage.subCategoryId = new mongoose.Types.ObjectId(subCategoryId);
    }
    if (manufacturer && manufacturer.trim() !== '') {
        matchStage.manufacturer = { $regex: manufacturer, $options: 'i' };
    }
    matchStage.price = {
        $gte: Number(minPrice),
        $lte: maxPrice ? Number(maxPrice) : Number.MAX_SAFE_INTEGER
    };
    if (search && search.trim() !== '') {
        matchStage.name = { $regex: search, $options: 'i' };
    }

    const skip = Number(offset);
    const lim = Number(limit);

    const medicines = await Medicine.aggregate([
        { $match: matchStage },
        {
            $project: {
                _id: 1,
                name: 1,
                manufacturer: 1,
                images: 1,
                price: 1,
                mrp: 1,
                discount: 1,
                description: 1,
                isActive: 1,
                categoryId: 1,
                subCategoryId: 1,
                createdAt: 1,
                updatedAt: 1
            }
        },
        { $sort: { [sortField]: sortOrder } },
        { $skip: skip },
        { $limit: lim }
    ]);

    const manufacturerList = [...new Set(medicines.map(item => item.manufacturer))];

    return NextResponse.json({
        status: true,
        data: medicines,
        manufacturerList
    });
}
