import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import GuestCart from '@/models/GuestCart';

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
    await connectDB();
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
    return NextResponse.json({ success: true, message: 'Guest cart cleared', cart });
}
