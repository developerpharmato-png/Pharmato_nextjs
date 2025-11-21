/**
 * @swagger
 * /api/customer/cart/get:
 *   post:
 *     summary: Get cart for user
 *     tags:
 *       - Cart
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               # No body required
 *     responses:
 *       200:
 *         description: Cart fetched
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 cart:
 *                   $ref: '#/components/schemas/Cart'
 */


import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Cart from '@/models/Cart';

export async function POST(request: NextRequest) {
    await dbConnect();
    let body: any = {};
    try {
        body = await request.json();
    } catch (err) {
        // If no body or invalid JSON, ignore
    }
    const userId = body.userId;
    if (!userId) {
        return NextResponse.json({ success: false, error: 'User not authenticated' }, { status: 401 });
    }
    const cart = await Cart.findOne({ userId }).populate('items.medicineId');
    return NextResponse.json({ success: true, cart });
}
