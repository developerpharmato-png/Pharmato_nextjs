import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import dbConnect from '@/lib/mongodb';

/**
 * @swagger
 * /api/admin/customers/list:
 *   get:
 *     summary: Get all customers (admin)
 *     tags:
 *       - Admin-Customer
 *     parameters:
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: string
 *           enum: [active, deleted]
 *     responses:
 *       200:
 *         description: Customer list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 */
export async function GET(req: NextRequest) {

    await dbConnect();

    try {
        // Extract query parameters
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const search = searchParams.get('search') || "";
        const limit = parseInt(searchParams.get('limit') || "10", 10);
        const offset = parseInt(searchParams.get('offset') || "0", 10);

        // Validate limit and offset
        if (isNaN(limit) || limit <= 0) {
            return NextResponse.json({
                success: false,
                message: 'Invalid limit parameter',
            }, { status: 400 });
        }

        if (isNaN(offset) || offset < 0) {
            return NextResponse.json({
                success: false,
                message: 'Invalid offset parameter',
            }, { status: 400 });
        }

        // Build the query object
        const query: any = {};
        if (status === 'active') {
            query.isActive = true;
        } else if (status === 'deleted') {
            query.isDelete = true;
        } else if (status && status !== 'all') {
            return NextResponse.json({
                success: false,
                message: 'Invalid status parameter',
            }, { status: 400 });
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { mobile: { $regex: search, $options: "i" } }
            ];
        }

        console.log('Query Parameters:', { status, search, limit, offset });
        console.log('Constructed Query:', query);

        // Fetch customers based on the query with pagination
        const total = await User.countDocuments(query);

        const customers = await User.find(query)
            .sort({ createdAt: -1 }) // latest first
            .skip(offset)
            .limit(limit)
            .lean();


        // Ensure walletAmount is present for all
        const data = customers.map(c => ({
            ...c,
            walletAmount: typeof c.walletAmount === 'undefined' ? 0 : c.walletAmount,
        }));

        return NextResponse.json({
            success: true,
            message: 'Customer list fetched successfully',
            data,
            total,
        });
    } catch (error) {
        console.error('Error fetching customers:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to fetch customers',
            error: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}
