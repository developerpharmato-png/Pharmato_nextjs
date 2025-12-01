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
 *               userId:
 *                 type: string
 *                 example: "USER_OBJECT_ID"
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
 *                 medicineInCart:
 *                   type: object
 *                   properties:
 *                     medicineId:
 *                       type: string
 *                     quantity:
 *                       type: number
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
    let medicineInCart: { medicineId: string, quantity: number } | null = null;
    if (!cart) {
        cart = await Cart.create({ userId, items: [{ medicineId, quantity }] });
    } else {
        const itemIndex = cart.items.findIndex((item: any) => item.medicineId.toString() === medicineId);
        if (itemIndex > -1) {
            cart.items[itemIndex].quantity += quantity;
            // Remove item if quantity goes to zero or below
            if (cart.items[itemIndex].quantity <= 0) {
                cart.items.splice(itemIndex, 1);
            }
        } else {
            // Only add if quantity is positive
            if (quantity > 0) {
                cart.items.push({ medicineId, quantity });
            }
        }
        await cart.save();
    }
    if (cart) {
        const updatedItem = cart.items.find((item: any) => item.medicineId.toString() === medicineId);
        if (updatedItem) {
            medicineInCart = {
                medicineId: updatedItem.medicineId.toString(),
                quantity: updatedItem.quantity
            };
        }
    }
    return NextResponse.json({
        success: true,
        cart,
        medicineInCart,
        message: 'Cart added successfully'
    });
}
