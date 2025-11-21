/**
 * @swagger
 * /api/customer/cart/remove:
 *   post:
 *     summary: Remove item from cart
 *     tags:
 *       - Cart
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               medicineId:
 *                 type: string
 *                 example: "MEDICINE_OBJECT_ID"
 *     responses:
 *       200:
 *         description: Cart item removed
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
    const { medicineId } = body;
    if (!userId) {
        return NextResponse.json({ success: false, error: 'User not authenticated' }, { status: 401 });
    }
    if (!medicineId || typeof medicineId !== 'string') {
        return NextResponse.json({ success: false, error: 'medicineId is required and must be a string' }, { status: 400 });
    }
    const cart = await Cart.findOne({ userId });
    if (!cart) {
        return NextResponse.json({ success: false, error: 'Cart not found' }, { status: 404 });
    }
    cart.items = cart.items.filter((item: any) => item.medicineId.toString() !== medicineId);
    await cart.save();
    return NextResponse.json({ success: true, cart });
}
