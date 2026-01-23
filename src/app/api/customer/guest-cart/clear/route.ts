import { NextRequest, NextResponse } from 'next/server';
import GuestCart from '@/models/GuestCart';
import mongoose from 'mongoose';
import { updateGuestCartCountInFirebase } from '@/utils/updateGuestCartCountInFirebase';
import connectDB from '@/lib/mongodb';
await connectDB();

/**
 * @swagger
 * /api/customer/guest-cart/clear:
 *   post:
 *     summary: Clear all items from guest cart
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
 *                 example: "GUEST_ID"
 *               storeId:
 *                 type: string
 *                 example: "STORE_ID"
 *     responses:
 *       200:
 *         description: Guest cart cleared
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 cart:
 *                   $ref: '#/components/schemas/GuestCart'
 */
export async function POST(request: NextRequest) {
    const body = await request.json();
    const { guestId, storeId } = body;
    if (!guestId || typeof guestId !== 'string') {
        return NextResponse.json({ success: false, message: 'Invalid input' }, { status: 401 });
    }
    if (!storeId || typeof storeId !== 'string') {
        return NextResponse.json({ success: false, message: 'storeId is required' }, { status: 400 });
    }
    const cart = await GuestCart.findOne({ guestId, storeId });
    if (!cart) {
        return NextResponse.json({ success: false, message: 'Guest cart not found' }, { status: 404 });
    }
    cart.items = [];
    await cart.save();

    // Update cart count in Firebase
    updateGuestCartCountInFirebase({ guestId, storeId }); // fire-and-forget, don't await

    return NextResponse.json({ success: true, message: 'Guest cart cleared', cart });
}
