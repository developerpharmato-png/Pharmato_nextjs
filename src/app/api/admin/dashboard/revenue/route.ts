import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';

function parseDateRange(body: any) {
    const { startDate, endDate, period } = body || {};

    function parseDateFlexible(ds: any) {
        if (!ds || typeof ds !== 'string') return null;
        const ddmmyyyy = /^\s*(\d{2})[:\-\/](\d{2})[:\-\/](\d{4})\s*$/;
        const ymd = /^\s*(\d{4})-(\d{2})-(\d{2})\s*$/;
        let m = ds.match(ddmmyyyy);
        if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
        m = ds.match(ymd);
        if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
        const parsed = new Date(ds);
        return isNaN(parsed.getTime()) ? null : parsed;
    }

    if (startDate || endDate) {
        const start = parseDateFlexible(startDate) || new Date(0);
        const end = parseDateFlexible(endDate) || new Date();
        if (endDate && typeof endDate === 'string' && endDate.trim().length <= 10) {
            end.setHours(23, 59, 59, 999);
        }
        return { start, end, period: 'custom' };
    }

    const now = new Date();
    if (period === 'all') return { start: new Date('2000-01-01'), end: new Date('2099-12-31'), period };
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
                { $or: [{ payment_status: { $in: ['paid', 'captured'] } }, { order_status: /deliv|complete/i }] }
            ]
        };

        // Constrain by date range on deliveredDate if present else createdAt
        match.$and.push({ $or: [{ deliveredDate: { $gte: start, $lte: end } }, { createdAt: { $gte: start, $lte: end } }] });

        // KPIs
        const revenueAgg = await Order.aggregate([
            { $match: match },
            { $group: { _id: null, totalRevenue: { $sum: '$total_order_amount' }, count: { $sum: 1 } } }
        ]);

        const totalRevenue = (revenueAgg[0]?.totalRevenue) || 0;

        // Trend
        const trend = await Order.aggregate([
            { $match: match },
            { $group: { _id: buildGroup(period), revenue: { $sum: '$total_order_amount' }, orders: { $sum: 1 } } },
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
            { $group: { _id: null, totalRevenue: { $sum: '$total_order_amount' } } }
        ]);

        const prevRevenue = prevAgg[0]?.totalRevenue || 0;
        const growth = prevRevenue ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : null;

        // --- NEW: Calculate Daily, Monthly, Yearly summaries for KPI Cards ---
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const yearStart = new Date(now.getFullYear(), 0, 1);

        const summaryAgg = await Order.aggregate([
            {
                $match: {
                    $or: [{ payment_status: { $in: ['paid', 'captured'] } }, { order_status: /deliv|complete/i }]
                }
            },
            {
                $facet: {
                    daily: [
                        { $match: { $or: [{ deliveredDate: { $gte: todayStart } }, { createdAt: { $gte: todayStart } }] } },
                        { $group: { _id: null, total: { $sum: '$total_order_amount' } } }
                    ],
                    monthly: [
                        { $match: { $or: [{ deliveredDate: { $gte: monthStart } }, { createdAt: { $gte: monthStart } }] } },
                        { $group: { _id: null, total: { $sum: '$total_order_amount' } } }
                    ],
                    yearly: [
                        { $match: { $or: [{ deliveredDate: { $gte: yearStart } }, { createdAt: { $gte: yearStart } }] } },
                        { $group: { _id: null, total: { $sum: '$total_order_amount' } } }
                    ]
                }
            }
        ]);

        const summary = {
            daily: summaryAgg[0]?.daily[0]?.total || 0,
            monthly: summaryAgg[0]?.monthly[0]?.total || 0,
            yearly: summaryAgg[0]?.yearly[0]?.total || 0
        };

        return NextResponse.json({
            success: true,
            data: {
                kpis: {
                    totalRevenue: parseFloat(totalRevenue.toFixed(2)),
                    period: { start, end }
                },
                summary,
                trend: trend.map((t: any) => ({ label: t._id, revenue: parseFloat(t.revenue.toFixed(2)), orders: t.orders })),
                previousPeriod: { totalRevenue: parseFloat(prevRevenue.toFixed(2)), growth: growth === null ? null : parseFloat(growth.toFixed(2)) }
            }
        });
    } catch (error: any) {
        console.error('admin/dashboard/revenue error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
