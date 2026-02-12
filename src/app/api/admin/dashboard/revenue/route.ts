import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';

function parseDateRange(body: any) {
    const { startDate, endDate, period } = body || {};
    if (startDate && endDate) return { start: new Date(startDate), end: new Date(endDate), period: 'custom' };
    const now = new Date();
    if (period === 'today') return { start: new Date(now.getFullYear(), now.getMonth(), now.getDate()), end: new Date(now.getTime() + 24 * 60 * 60 * 1000 - 1), period };
    if (period === 'week') {
        const day = now.getDay();
        const s = new Date(now);
        s.setDate(now.getDate() - day);
        s.setHours(0, 0, 0, 0);
        const e = new Date(s);
        e.setDate(s.getDate() + 7);
        return { start: s, end: e, period };
    }
    if (period === 'year') return { start: new Date(now.getFullYear(), 0, 1), end: new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999), period };
    // default month
    return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999), period: 'month' };
}

function buildGroup(period: string) {
    const dateField = { $ifNull: ['$deliveredDate', '$createdAt'] };
    if (period === 'today') return { $dateToString: { format: '%Y-%m-%d %H:00', date: dateField } };
    if (period === 'month' || period === 'year') return { $dateToString: { format: '%Y-%m', date: dateField } };
    return { $dateToString: { format: '%Y-%m-%d', date: dateField } };
}

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json().catch(() => ({}));
        const { start, end, period } = parseDateRange(body);

        // Consider orders with deliveredDate (delivered revenue) or fallback to createdAt
        const dateField = 'deliveredDate';

        const match: any = {
            $and: [
                { $or: [{ deliveredDate: { $exists: true, $ne: null } }, { createdAt: { $exists: true } }] },
                { $or: [{ payment_status: 'paid' }, { order_status: /deliv|complete/i }] }
            ]
        };

        // Constrain by date range on deliveredDate if present else createdAt
        match.$and.push({ $or: [{ deliveredDate: { $gte: start, $lte: end } }, { createdAt: { $gte: start, $lte: end } }] });

        // KPIs
        const revenueAgg = await Order.aggregate([
            { $match: match },
            { $group: { _id: null, totalRevenue: { $sum: '$actual_amount' }, count: { $sum: 1 } } }
        ]);

        const totalRevenue = (revenueAgg[0]?.totalRevenue) || 0;

        // Trend
        const trend = await Order.aggregate([
            { $match: match },
            { $group: { _id: buildGroup(period), revenue: { $sum: '$actual_amount' }, orders: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);
        console.log('Revenue trend aggregation:', { dateRange: { start, end }, trendLength: trend.length, trend });

        // Previous period comparison
        const timeDiff = end.getTime() - start.getTime();
        const prevStart = new Date(start.getTime() - timeDiff);
        const prevEnd = new Date(start.getTime() - 1);
        const prevMatch = { ...match };
        // swap the date constraint
        prevMatch.$and = prevMatch.$and.map((c: any) => {
            if (c.$or && c.$or.some((o: any) => o.deliveredDate || o.createdAt)) {
                return { $or: [{ deliveredDate: { $gte: prevStart, $lte: prevEnd } }, { createdAt: { $gte: prevStart, $lte: prevEnd } }] };
            }
            return c;
        });

        const prevAgg = await Order.aggregate([
            { $match: prevMatch },
            { $group: { _id: null, totalRevenue: { $sum: '$actual_amount' } } }
        ]);

        const prevRevenue = prevAgg[0]?.totalRevenue || 0;
        const growth = prevRevenue ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : null;

        return NextResponse.json({
            success: true,
            data: {
                kpis: {
                    totalRevenue: parseFloat(totalRevenue.toFixed(2)),
                    period: { start, end }
                },
                trend: trend.map((t: any) => ({ label: t._id, revenue: parseFloat(t.revenue.toFixed(2)), orders: t.orders })),
                previousPeriod: { totalRevenue: parseFloat(prevRevenue.toFixed(2)), growth: growth === null ? null : parseFloat(growth.toFixed(2)) }
            }
        });
    } catch (error: any) {
        console.error('admin/dashboard/revenue error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
