import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import dbConnect from '@/lib/mongodb';
import { requireAdminAuth } from '../../requireAdminAuth';

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
    const adminOrError = await requireAdminAuth(req);
    if (adminOrError instanceof NextResponse) return adminOrError;

    await dbConnect();

    // Extract query parameters
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    // Build the query object
    const query: any = {};
    if (status === 'active') {
        query.isActive = true;
    } else if (status === 'deleted') {
        query.isDelete = true;
    }

    // Fetch customers based on the query
    const customers = await User.find(query).lean();

    // Ensure walletAmount is present for all
    const data = customers.map(c => ({
        ...c,
        walletAmount: typeof c.walletAmount === 'undefined' ? 0 : c.walletAmount,
    }));

    return NextResponse.json({
        success: true,
        message: 'Customer list fetched successfully',
        data,
    });
}
