import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';

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
        const { 
            offset = 0, 
            limit = 10, 
            page = 0, 
            search = '', 
            customerId 
        } = body;

        // Calculate skip based on page or offset
        const skip = page > 0 ? page * limit : offset;
        
        // Build query
        const query: any = {};
        
        // Filter by customerId if provided
        if (customerId && typeof customerId === 'string') {
            query.userId = customerId;
        }
        
        // Search by order_id or user details
        if (search && search.trim()) {
            query.$or = [
                { order_id: { $regex: search, $options: 'i' } },
                { payment_id: { $regex: search, $options: 'i' } }
            ];
        }

        // Get total count
        const total = await Order.countDocuments(query);

        // Fetch orders with pagination
        const orders = await Order.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate({
                path: 'userId',
                select: '_id name email phone'
            })
            .populate({
                path: 'medicineId',
                select: '_id name manufacturer mrp price discount images coverImage'
            })
            .lean();

        // Attach quantity to each medicine in medicineId for every order
        const ordersWithQuantities = orders.map(order => {
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

        return NextResponse.json({ 
            success: true, 
            data: ordersWithQuantities,
            total 
        });

    } catch (error) {
        console.error('Error fetching orders:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch orders' },
            { status: 500 }
        );
    }
}
