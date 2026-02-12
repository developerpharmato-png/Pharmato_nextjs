import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';

type Period = 'today' | 'week' | 'month' | 'year' | 'all';

function parseDateRange(body: any, defaultPeriod: Period = 'month') {
    const { startDate, endDate, period } = body || {};
    if (startDate && endDate) {
        return { start: new Date(startDate), end: new Date(endDate), period: 'custom' };
    }
    const now = new Date();
    if (period === 'all') {
        // Return all time - very old start date to far future
        return { start: new Date('2000-01-01'), end: new Date('2099-12-31'), period };
    }
    if (period === 'today') {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
        return { start, end, period };
    }
    if (period === 'week') {
        const day = now.getDay();
        const start = new Date(now);
        start.setDate(now.getDate() - day);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(start.getDate() + 7);
        return { start, end, period };
    }
    if (period === 'year') {
        const start = new Date(now.getFullYear(), 0, 1);
        const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        return { start, end, period };
    }
    // default: month
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start, end, period: defaultPeriod };
}

function buildTrendGroup(period: string) {
    if (period === 'today') {
        return { $dateToString: { format: '%Y-%m-%d %H:00', date: '$createdAt' } };
    }
    if (period === 'month' || period === 'year') {
        return { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
    }
    // week or custom -> daily
    return { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
}

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json().catch(() => ({}));
        const { start, end, period } = parseDateRange(body, body?.period || 'month');

        const match: any = { createdAt: { $gte: start, $lte: end } };

        const [totalOrders, statusCounts, trend] = await Promise.all([
            Order.countDocuments(match),
            Order.aggregate([
                { $match: match },
                { $group: { _id: '$order_status', count: { $sum: 1 } } }
            ]),
            Order.aggregate([
                { $match: match },
                { $group: { _id: buildTrendGroup(period), count: { $sum: 1 } } },
                { $sort: { _id: 1 } }
            ])
        ]);

        // Also compute all-time status counts (no date filter) so dashboard can show/compare overall totals
        const [totalOrdersAll, statusCountsAll] = await Promise.all([
            Order.countDocuments({}),
            Order.aggregate([
                { $group: { _id: '$order_status', count: { $sum: 1 } } }
            ])
        ]);

        const formatTrend = trend.map((d: any) => ({ label: d._id, value: d.count }));

        // Treat 'confirmed' as statuses containing 'confirm' or 'complete'
        const confirmed = statusCounts.reduce((acc: number, s: any) => {
            if (/confirm|complete/i.test(s._id)) return acc + s.count;
            return acc;
        }, 0);

        const cancelled = (statusCounts.find((s: any) => /cancel/i.test(s._id)) || { count: 0 }).count;

        // Pending = everything that's not confirmed, cancelled or delivered
        const pending = statusCounts.reduce((acc: number, s: any) => {
            if (!/confirm|cancel|deliv/i.test(s._id)) return acc + s.count;
            return acc;
        }, 0);

        // helper: normalized key for statuses (trim + lowercase)
        const normalize = (s: any) => (typeof s === 'string' ? s.trim().toLowerCase() : String(s || '').trim().toLowerCase());

        // derive overall kpis from statusCountsAll
        const overallConfirmed = statusCountsAll.reduce((acc: number, s: any) => {
            if (/confirm|complete/i.test(s._id)) return acc + s.count;
            return acc;
        }, 0);
        const overallCancelled = (statusCountsAll.find((s: any) => /cancel/i.test(s._id)) || { count: 0 }).count;
        const overallPending = statusCountsAll.reduce((acc: number, s: any) => {
            if (!/confirm|cancel|deliv/i.test(s._id)) return acc + s.count;
            return acc;
        }, 0);

        // exact counts for canonical statuses (case-insensitive exact match) to compare with Order list
        const findExact = (arr: any[], key: string) => {
            const nk = key.trim().toLowerCase();
            const found = arr.find((x: any) => normalize(x._id) === nk);
            return (found && found.count) || 0;
        };
        const overallPendingExact = findExact(statusCountsAll, 'Pending');
        const overallConfirmedExact = findExact(statusCountsAll, 'Confirmed') || findExact(statusCountsAll, 'Completed');

        return NextResponse.json({
            success: true,
            data: {
                kpis: {
                    totalOrders,
                    confirmed,
                    pending,
                    cancelled
                },
                statusCounts,
                trend: formatTrend,
                period: { start, end },
                overallKpis: {
                    totalOrders: totalOrdersAll,
                    confirmed: overallConfirmed,
                    pending: overallPending,
                    cancelled: overallCancelled,
                    // exact canonical counts to compare with /api/admin/order/list behaviour
                    pendingExact: overallPendingExact,
                    confirmedExact: overallConfirmedExact
                },
                statusCountsAll
            }
        });
    } catch (error: any) {
        console.error('admin/dashboard/orders error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
