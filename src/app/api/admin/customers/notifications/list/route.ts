import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import AdminCustomerNotification from '@/models/AdminCustomerNotification';

export async function POST(request: NextRequest) {
    await dbConnect();
    try {
        // 1. Safety check for empty body
        const body = await request.json().catch(() => ({}));

        let { limit, offset, search } = body;

        limit = Number(limit) || 10;

        // Ensure offset doesn't result in a negative number
        const page = Math.max(1, Number(offset) || 1);
        const skip = (page - 1) * limit;

        // 2. Build Query - Use fields that DEFINITELY exist in your schema
        let query: any = {};
        if (search && typeof search === 'string' && search.trim() !== "") {
            const searchRegex = { $regex: search.trim(), $options: 'i' };

            query.$or = [
                { title: searchRegex },   // Make sure 'title' exists in AdminCustomerNotification model
                { message: searchRegex }  // Make sure 'message' exists in AdminCustomerNotification model
            ];
        }

        // 3. Execution


        // Use aggregation to exclude 'recipients' field
        const notificationsAgg = await AdminCustomerNotification.aggregate([
            { $match: query },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
            { $project: { recipients: 0 } },
        ]);
        const total = await AdminCustomerNotification.countDocuments(query);

        return NextResponse.json({
            status: true,
            data: notificationsAgg,
            total
        });

    } catch (err: any) {
        // This log will appear in your VS Code / Terminal console
        console.error('API Error:', err.message);

        return NextResponse.json({
            status: false,
            message: err.message || 'Failed to fetch notifications'
        }, { status: 500 });
    }
}