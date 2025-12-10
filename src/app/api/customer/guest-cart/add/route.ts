import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import GuestCart from '@/models/GuestCart';
import Medicine from '@/models/Medicine';

/**
 * @swagger
 * /api/customer/guest-cart/add:
 *   post:
 *     summary: Add item to guest cart
 *     tags:
 *       - GuestCart
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               guestId:
 *                 type: string
 *               medicineId:
 *                 type: string
 *               quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Item added to guest cart
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 cart:
 *                   $ref: '#/components/schemas/GuestCart'
 *                 medicineInCart:
 *                   type: object
 *                   properties:
 *                     medicineId:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                 message:
 *                   type: string
 */
export async function POST(request: NextRequest) {
    await connectDB();
    const body = await request.json();
    const { guestId, medicineId, quantity } = body;
    if (!guestId || typeof guestId !== 'string') {
        return NextResponse.json({ success: false, message: 'Invalid input', data: null }, { status: 401 });
    }
    if (!medicineId || typeof medicineId !== 'string') {
        return NextResponse.json({ success: false, message: 'Invalid input', data: null }, { status: 400 });
    }
    if (typeof quantity !== 'number' || quantity === 0) {
        return NextResponse.json({ success: false, message: 'Invalid input', data: null }, { status: 400 });
    }
    let cart = await GuestCart.findOne({ guestId });
    let medicineInCart: { medicineId: string, quantity: number } | null = null;
    if (!cart) {
        cart = await GuestCart.create({ guestId, items: [{ medicineId, quantity }] });
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
        } else {
            medicineInCart = {
                medicineId: medicineId,
                quantity: 0
            };
        }
    }
    return NextResponse.json({
        success: true,
        cart,
        medicineInCart,
        message: 'Added to Cart'
    });
}
