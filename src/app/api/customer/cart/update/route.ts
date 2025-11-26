/**
 * @swagger
 * /api/customer/cart/update:
 *   post:
 *     summary: Update cart item quantity
 *     tags:
 *       - Cart
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "USER_OBJECT_ID"
 *               medicineId:
 *                 type: string
 *                 example: "MEDICINE_OBJECT_ID"
 *               quantity:
 *                 type: integer
 *                 example: 3
 *     responses:
 *       200:
 *         description: Cart item updated
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
    const { userId, medicineId, quantity } = body;
    if (!userId || typeof userId !== 'string') {
        return NextResponse.json({ success: false, error: 'userId is required and must be a string' }, { status: 401 });
    }
    if (!medicineId || typeof medicineId !== 'string') {
        return NextResponse.json({ success: false, error: 'medicineId is required and must be a string' }, { status: 400 });
    }
    if (typeof quantity !== 'number' || quantity === 0) {
        return NextResponse.json({ success: false, error: 'quantity must be a non-zero integer' }, { status: 400 });
    }
    let cart = await Cart.findOne({ userId });
    if (!cart) {
        return NextResponse.json({ success: false, error: 'Cart not found' }, { status: 404 });
    }
    const itemIndex = cart.items.findIndex((item: any) => item.medicineId.toString() === medicineId);
    if (itemIndex > -1) {
        cart.items[itemIndex].quantity += quantity;
        // Remove item if quantity goes to zero or below
        if (cart.items[itemIndex].quantity <= 0) {
            cart.items.splice(itemIndex, 1);
        }
        await cart.save();
        cart = await Cart.findOne({ userId }).populate({
            path: 'items.medicineId',
            select: '_id name manufacturer isPrescription mrp price images'
        });
        return NextResponse.json({ success: true, cart });
    }
    // Only add if quantity is positive
    if (quantity > 0) {
        cart.items.push({ medicineId, quantity });
        await cart.save();
        cart = await Cart.findOne({ userId }).populate({
            path: 'items.medicineId',
            select: '_id name manufacturer isPrescription mrp price images'
        });
        return NextResponse.json({ success: true, cart });
    }
    return NextResponse.json({ success: false, error: 'Item not found in cart and quantity is negative' }, { status: 404 });
}
