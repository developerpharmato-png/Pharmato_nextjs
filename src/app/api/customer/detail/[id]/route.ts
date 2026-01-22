import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import dbConnect from '@/lib/mongodb';

/**
 * @swagger
 * /api/customer/detail/{id}:
 *   get:
 *     summary: Get customer details by ID
 *     tags:
 *       - Customer
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer MongoDB ID
 *     responses:
 *       200:
 *         description: Customer details
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
 *                   type: object
 *       400:
 *         description: Customer id is required
 *       404:
 *         description: Customer not found
 */
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params;
    await dbConnect();
    if (!id) {
        return NextResponse.json({ success: false, message: 'Customer id is required', data: null }, { status: 400 });
    }
    let user = await User.findById(id).lean();
    if (Array.isArray(user)) {
        user = user[0];
    }
    if (!user) {
        return NextResponse.json({ success: false, message: 'Customer not found', data: null }, { status: 404 });
    }
    if (typeof user.walletAmount === 'undefined') user.walletAmount = 0;
    user.walletAmount = parseFloat(Number(user.walletAmount).toFixed(2));
    return NextResponse.json({ success: true, message: 'Customer details fetched successfully', data: user });
}
