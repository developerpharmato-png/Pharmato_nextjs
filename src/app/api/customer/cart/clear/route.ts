/**
 * @swagger
 * /api/customer/cart/clear:
 *   post:
 *     summary: Clear all items from cart
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
 *         description: Cart cleared
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
import Medicine from '@/models/Medicine';

export async function POST(request: NextRequest) {
    await dbConnect();
    const body = await request.json();
    const userId = body.userId || request.headers.get('x-user-id');
    if (!userId) {
        return NextResponse.json({ success: false, error: 'User not authenticated' }, { status: 401 });
    }
    const cart = await Cart.findOne({ userId });
    if (!cart) {
        return NextResponse.json({ success: false, error: 'Cart not found' }, { status: 404 });
    }
    cart.items = [];
    await cart.save();
    return NextResponse.json({ success: true, cart });
}
