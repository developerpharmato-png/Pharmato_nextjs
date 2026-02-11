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
        const filters: any = { isDeleted: false };
        if (body.storeId) filters.storeId = body.storeId;
        if (body.categoryId) filters.categoryId = body.categoryId;

        const now = new Date();

        const [total, lowStock, outOfStock, expired] = await Promise.all([
            Medicine.countDocuments(filters),
            Medicine.countDocuments({ ...filters, stock: { $gt: 0, $lte: threshold } }),
            Medicine.countDocuments({ ...filters, stock: 0 }),
            Medicine.countDocuments({ ...filters, expiryDate: { $lt: now } })
        ]);

        const lowStockList = await Medicine.find({ ...filters, stock: { $gt: 0, $lte: threshold } })
            .select('name stock expiryDate uniqueCode')
            .limit(50)
            .lean();

        const expiredList = await Medicine.find({ ...filters, expiryDate: { $lt: now } })
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
                    threshold
                },
                lowStockList,
                expiredList
            }
        });
    } catch (error: any) {
        console.error('admin/dashboard/inventory error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
