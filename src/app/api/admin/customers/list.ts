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

export async function GET() {
    
    await dbConnect();
    const customers = await User.find({}).lean();
    // Ensure walletAmount is present for all
    const data = customers.map(c => ({ ...c, walletAmount: typeof c.walletAmount === 'undefined' ? 0 : c.walletAmount }));
    return NextResponse.json({ success: true, message: 'Customer list fetched successfully', data });
}
