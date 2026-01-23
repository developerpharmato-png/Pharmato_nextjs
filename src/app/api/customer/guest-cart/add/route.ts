import { NextRequest, NextResponse } from 'next/server';
import GuestCart from '@/models/GuestCart';
import Medicine from '@/models/Medicine';
import { updateGuestCartCountInFirebase } from '@/utils/updateGuestCartCountInFirebase';
import connectDB from '@/lib/mongodb';
await connectDB();

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
 *               storeId:
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
    const body = await request.json();
    const { guestId, storeId, medicineId, quantity } = body;
    if (!guestId || typeof guestId !== 'string') {
        return NextResponse.json({ success: false, message: 'guestId is required and must be a string', data: null }, { status: 401 });
    }
    if (!storeId || typeof storeId !== 'string') {
        return NextResponse.json({ success: false, message: 'storeId is required and must be a string', data: null }, { status: 400 });
    }
    if (!medicineId || typeof medicineId !== 'string') {
        return NextResponse.json({ success: false, message: 'medicineId is required and must be a string', data: null }, { status: 400 });
    }
    if (typeof quantity !== 'number' || quantity === 0) {
        return NextResponse.json({ success: false, message: 'quantity must be a non-zero integer', data: null }, { status: 400 });
    }
    // Prevent mixing items from different stores in the same cart
    const otherStoreCart = await GuestCart.findOne({ guestId, storeId: { $ne: storeId }, items: { $exists: true, $not: { $size: 0 } } });
    if (otherStoreCart) {
        return NextResponse.json({
            success: false,
            message: 'Cart contains items from another store. Please clear your cart before adding items from a new store.',
            otherStoreId: otherStoreCart.storeId?.toString?.() || '',
            cart: otherStoreCart
        }, { status: 409 });
    }
    let cart = await GuestCart.findOne({ guestId, storeId });
    let medicineInCart: { medicineId: string, quantity: number } | null = null;
    if (!cart) {
        cart = await GuestCart.create({ guestId, storeId, items: [{ medicineId, quantity }] });
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

    // Update cart count in Firebase
    updateGuestCartCountInFirebase({ guestId, storeId }); // fire-and-forget, don't await

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
