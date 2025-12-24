import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
// Ensure referenced models are registered for populate
import '@/models/Medicine';
import User from '@/models/User';
import { log } from '@/lib/logger';
import { format } from 'date-fns';

/**
 * @swagger
 * /api/admin/order/list:
 *   post:
 *     summary: Get list of orders for admin with filters
 *     tags:
 *       - Admin Orders
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               offset:
 *                 type: number
 *                 description: Number of records to skip
 *                 default: 0
 *               limit:
 *                 type: number
 *                 description: Number of records to return
 *                 default: 10
 *               page:
 *                 type: number
 *                 description: Page number (alternative to offset)
 *                 default: 0
 *               search:
 *                 type: string
 *                 description: Search by order ID or customer name
 *               customerId:
 *                 type: string
 *                 description: Filter by customer ID (optional)
 *               storeId:
 *                 type: string
 *                 description: (Currently ignored) Store ID was accepted but all orders are returned regardless.
 *               roleName:
 *                 type: string
 *                 description: Admin role name (SuperAdmin sees all orders)
 *     responses:
 *       200:
 *         description: List of orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 total:
 *                   type: number
 *       400:
 *         description: Invalid input
 */

export async function POST(req: NextRequest) {
    await dbConnect();
    
    try {
        const body = await req.json();
        log.info('AdminOrderList: incoming body', body);
        const { 
            offset = 0, 
            limit = 10, 
            page = 0, 
            search = '', 
            customerId,
            storeId,
            roleName,
            prescription_status,
            order_status
        } = body || {};

            // Accept several names for day filter: `day`, `dayFilter`, or `days`.
            // Supported values: 'all' | 'today' | 'last7' | 'last30' or a numeric N to mean last N days.
            const rawDay = (body && (body.day ?? body.dayFilter ?? body.days)) || 'all';
            const dayFilter = typeof rawDay === 'string' || typeof rawDay === 'number' ? rawDay : 'all';

        // Coerce numeric inputs safely
        let parsedLimit = Number.isFinite(Number(limit)) ? Number(limit) : 10;
        if (parsedLimit <= 0) parsedLimit = 10;
        const parsedOffset = Number.isFinite(Number(offset)) ? Number(offset) : 0;
        const parsedPage = Number.isFinite(Number(page)) ? Number(page) : 0;

        // Calculate skip based on page or offset
        const skip = parsedPage > 0 ? parsedPage * parsedLimit : parsedOffset;
        
        // Build query
        const query: any = {};
        
        // storeId intentionally ignored: return all orders regardless of store assignment
        if (typeof storeId === 'string' && storeId.trim() !== '') {
            log.info('AdminOrderList: storeId provided but ignored for full listing', storeId.trim());
        }
        
        // Filter by customerId if provided
        if (customerId && typeof customerId === 'string') {
            query.userId = customerId;
        }

        // Filter by prescription_status if provided
        if (prescription_status && typeof prescription_status === 'string') {
            query.prescription_status = prescription_status;
        }

        // Filter by order_status if provided
        if (order_status && typeof order_status === 'string') {
            query.order_status = order_status;
        }
        
        // Search by order_id, payment_id, or user details (name/email/mobile)
        if (search && search.trim()) {
            const regex = { $regex: search, $options: 'i' };

            // base OR conditions for order fields
            const orConditions: any[] = [
                { order_id: regex },
                { payment_id: regex }
            ];

            // find users matching the search (name, email, mobile)
            try {
                const matchingUsers = await User.find({
                    $or: [
                        { name: regex },
                        { email: regex },
                        { mobile: regex }
                    ]
                }).select('_id').lean();

                const userIds = Array.isArray(matchingUsers) ? matchingUsers.map(u => u._id) : [];
                if (userIds.length > 0) {
                    orConditions.push({ userId: { $in: userIds } });
                }
            } catch (e: any) {
                log.error('AdminOrderList: user lookup failed', e?.message || e);
            }

            query.$or = orConditions;
        }

            // If client provided explicit startDate/endDate use that (overrides day filter)
            const { startDate, endDate } = body || {};
            let createdAtSet = false;
            function parseDateFlexible(ds: any) {
                if (!ds) return null;
                if (typeof ds !== 'string') return null;
                const ddmmyyyy = /^\s*(\d{2})[:\-\/](\d{2})[:\-\/](\d{4})\s*$/; // matches 11:12:2025 or 11-12-2025 or 11/12/2025
                const ymd = /^\s*(\d{4})-(\d{2})-(\d{2})\s*$/; // 2025-12-11
                let m = ds.match(ddmmyyyy);
                if (m) {
                    const day = Number(m[1]);
                    const month = Number(m[2]) - 1;
                    const year = Number(m[3]);
                    return new Date(year, month, day);
                }
                m = ds.match(ymd);
                if (m) {
                    const year = Number(m[1]);
                    const month = Number(m[2]) - 1;
                    const day = Number(m[3]);
                    return new Date(year, month, day);
                }
                // fallback to Date parsing
                const parsed = new Date(ds);
                if (isNaN(parsed.getTime())) return null;
                return parsed;
            }
            if (startDate || endDate) {
                const start = parseDateFlexible(startDate) || new Date(0);
                const end = parseDateFlexible(endDate) || new Date();
                if (endDate && typeof endDate === 'string' && endDate.trim().length === 10) {
                    end.setHours(23,59,59,999);
                }
                query.createdAt = { $gte: start, $lte: end };
                createdAtSet = true;
            }

            // Day filter: limit by createdAt (only if explicit dates not provided)
            if (!createdAtSet && dayFilter && dayFilter !== 'all') {
                const now = new Date();
                let start: Date | null = null;
                let end: Date = now;

                if (String(dayFilter) === 'today') {
                    start = new Date(now);
                    start.setHours(0,0,0,0);
                    end = new Date(now);
                    end.setHours(23,59,59,999);
                } else if (String(dayFilter) === 'last7') {
                    start = new Date(now);
                    start.setDate(start.getDate() - 6);
                    start.setHours(0,0,0,0);
                } else if (String(dayFilter) === 'last30') {
                    start = new Date(now);
                    start.setDate(start.getDate() - 29);
                    start.setHours(0,0,0,0);
                } else if (!Number.isNaN(Number(dayFilter))) {
                    // numeric N days (last N days including today)
                    const n = Math.max(1, Math.floor(Number(dayFilter)));
                    start = new Date(now);
                    start.setDate(start.getDate() - (n - 1));
                    start.setHours(0,0,0,0);
                }

                if (start) {
                    query.createdAt = { $gte: start, $lte: end };
                }
            }

        // Get total count
        const total = await Order.countDocuments(query);

        // Fetch orders with pagination
        log.debug('AdminOrderList: query', { query, skip, parsedLimit });
        const orders = await Order.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parsedLimit)
            .populate({
                path: 'userId',
                select: '_id name email mobile'
            })
            .populate({
                path: 'medicineId',
                select: '_id name manufacturer mrp price discount images coverImage'
            })
            .lean();
        log.info('AdminOrderList: fetched orders count', Array.isArray(orders) ? orders.length : 0);

        // Attach quantity to each medicine in medicineId for every order
        const ordersWithQuantities = (Array.isArray(orders) ? orders : []).map(order => {
            const medicineQuantities = Array.isArray(order.medicineQuantity) ? order.medicineQuantity : [];
            const medicineIdWithQuantity = Array.isArray(order.medicineId)
                ? order.medicineId.map((med: any) => {
                    const q = medicineQuantities.find((qty: any) => {
                        return (qty.medicineId?.toString && med._id?.toString && 
                                qty.medicineId.toString() === med._id.toString());
                    });
                    return {
                        ...med,
                        quantity: q?.quantity || 1
                    };
                })
                : [];
            
            return {
                ...order,
                medicineId: medicineIdWithQuantity
            };
        });

        // Also include a human-friendly createdAt string in DD-MM-YYYY
        const ordersWithFormattedDates = ordersWithQuantities.map(o => ({
            ...o,
            createdAtFormatted: o.createdAt ? format(new Date(o.createdAt), 'dd-MM-yyyy') : ''
        }));

        log.success('AdminOrderList: success', { count: ordersWithQuantities.length, total });
        return NextResponse.json({ 
            success: true, 
            data: ordersWithFormattedDates,
            total 
        });

    } catch (error: any) {
        log.error('AdminOrderList: error', error?.message || error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch orders', error: error?.message },
            { status: 500 }
        );
    }
}
