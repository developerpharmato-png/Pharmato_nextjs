/**
 * @swagger
 * /api/customer/cart/add:
 *   post:
 *     summary: Add item to cart
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
 *               quantity:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       200:
 *         description: Item added to cart
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
    const { medicineId, quantity } = body;
    if (!userId) {
        return NextResponse.json({ success: false, error: 'User not authenticated' }, { status: 401 });
    }
    if (!medicineId || typeof medicineId !== 'string') {
        return NextResponse.json({ success: false, error: 'medicineId is required and must be a string' }, { status: 400 });
    }
    if (typeof quantity !== 'number' || quantity < 1) {
        return NextResponse.json({ success: false, error: 'quantity must be a positive integer' }, { status: 400 });
    }
    let cart = await Cart.findOne({ userId });
    if (!cart) {
        cart = await Cart.create({ userId, items: [{ medicineId, quantity }] });
    } else {
        const itemIndex = cart.items.findIndex((item: any) => item.medicineId.toString() === medicineId);
        if (itemIndex > -1) {
            cart.items[itemIndex].quantity += quantity;
        } else {
            cart.items.push({ medicineId, quantity });
        }
        await cart.save();
    }
    return NextResponse.json({ success: true, cart });
}
