import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import dbConnect from '@/lib/mongodb';

/**
 * @swagger
 * /api/admin/customers/active/{id}:
 *   put:
 *     summary: Update user's isActive status (admin)
 *     tags:
 *       - Admin-Customer
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer MongoDB ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User active status updated
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
 *         description: Missing required fields
 *       404:
 *         description: User not found
 */
export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params;
    await dbConnect();
    const body = await req.json();
    const { isActive } = body;
    if (typeof isActive !== 'boolean') {
        return NextResponse.json({ success: false, message: 'Missing isActive field', data: null }, { status: 400 });
    }
    const user = await User.findByIdAndUpdate(id, { isActive }, { new: true });
    if (!user) {
        return NextResponse.json({ success: false, message: 'User not found', data: null }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'User active status updated', data: user });
}
