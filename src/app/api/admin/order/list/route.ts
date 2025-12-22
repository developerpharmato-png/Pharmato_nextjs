import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
// Ensure referenced models are registered for populate
import '@/models/Medicine';
import User from '@/models/User';
import { log } from '@/lib/logger';

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
            roleName 
        } = body || {};

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

        log.success('AdminOrderList: success', { count: ordersWithQuantities.length, total });
        return NextResponse.json({ 
            success: true, 
            data: ordersWithQuantities,
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
