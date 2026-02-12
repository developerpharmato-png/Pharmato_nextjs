import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Medicine from '@/models/Medicine';
import Setting from '@/models/Setting';

async function getLowStockThreshold() {
    try {
        const s = await Setting.findOne({ type: 'low_stock_threshold' }).lean();
        if (s && s.data_value_in) {
            const num = parseInt(String(s.data_value_in), 10);
            if (!isNaN(num)) return num;
        }
    } catch (e) { }
    return 10; // default
}

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json().catch(() => ({}));
        const threshold = body.threshold ?? await getLowStockThreshold();
        const filters: any = {};
        if (body.storeId) filters.storeId = body.storeId;
        if (body.categoryId) filters.categoryId = body.categoryId;

        // Use date with hours reset to 0 to match medicines list API
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        // compute 15-day window for "expiring soon"
        const soon = new Date(now);
        soon.setDate(soon.getDate() + 15);
        soon.setHours(23, 59, 59, 999);

        const [total, lowStock, outOfStock, expired, expiringSoonCount] = await Promise.all([
            Medicine.countDocuments(filters),
            Medicine.countDocuments({ ...filters, stock: { $gt: 0, $lt: threshold } }),
            Medicine.countDocuments({
                ...filters,
                $or: [
                    { stock: { $lte: 0 } },
                    { stock: { $exists: false } }
                ]
            }),
            Medicine.countDocuments({ ...filters, expiryDate: { $lt: now } }),
            Medicine.countDocuments({ ...filters, expiryDate: { $gte: now, $lte: soon } })
        ]);

        const lowStockList = await Medicine.find({ ...filters, stock: { $gt: 0, $lt: threshold } })
            .select('name stock expiryDate uniqueCode')
            .limit(50)
            .lean();

        const expiredList = await Medicine.find({ ...filters, expiryDate: { $lt: now } })
            .select('name stock expiryDate uniqueCode')
            .limit(50)
            .lean();

        const expiringSoonList = await Medicine.find({ ...filters, expiryDate: { $gte: now, $lte: soon } })
            .select('name stock expiryDate uniqueCode')
            .limit(50)
            .lean();

        return NextResponse.json({
            success: true,
            data: {
                kpis: {
                    totalMedicines: total,
                    lowStockMedicines: lowStock,
                    outOfStockMedicines: outOfStock,
                    expiredMedicines: expired,
                    expiringSoonMedicines: expiringSoonCount,
                    threshold
                },
                lowStockList,
                expiredList,
                expiringSoonList
            }
        });
    } catch (error: any) {
        console.error('admin/dashboard/inventory error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
