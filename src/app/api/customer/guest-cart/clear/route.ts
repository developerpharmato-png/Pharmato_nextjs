import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import GuestCart from '@/models/GuestCart';

/**
 * @swagger
 * 
 * :
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
    const { guestId } = body;
    if (!guestId || typeof guestId !== 'string') {
        return NextResponse.json({ success: false, message: 'Invalid input' }, { status: 401 });
    }
    const cart = await GuestCart.findOne({ guestId });
    if (!cart) {
        return NextResponse.json({ success: false, message: 'Guest cart not found' }, { status: 404 });
    }
    cart.items = [];
    await cart.save();
    return NextResponse.json({ success: true, message: 'Guest cart cleared', cart });
}
