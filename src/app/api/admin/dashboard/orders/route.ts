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

        const formatTrend = trend.map((d: any) => ({ label: d._id, value: d.count }));

        const completed = (statusCounts.find((s: any) => /deliv|complete/i.test(s._id)) || { count: 0 }).count;
        const cancelled = (statusCounts.find((s: any) => /cancel/i.test(s._id)) || { count: 0 }).count;
        const pending = statusCounts.reduce((acc: number, s: any) => {
            if (!/deliv|complete|cancel/i.test(s._id)) return acc + s.count;
            return acc;
        }, 0);

        return NextResponse.json({
            success: true,
            data: {
                kpis: {
                    totalOrders,
                    completed,
                    pending,
                    cancelled
                },
                statusCounts,
                trend: formatTrend,
                period: { start, end }
            }
        });
    } catch (error: any) {
        console.error('admin/dashboard/orders error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
