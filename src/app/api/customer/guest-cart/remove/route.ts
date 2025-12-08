import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import GuestCart from '@/models/GuestCart';

/**
 * @swagger
 * /api/customer/guest-cart/remove:
 *   post:
 *     summary: Remove one item from guest cart
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
 *               medicineId:
 *                 type: string
 *                 example: "MEDICINE_ID"
 *     responses:
 *       200:
 *         description: Item removed from guest cart
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
    const { guestId, medicineId } = body;
    if (!guestId) {
        return NextResponse.json({ success: false, error: 'Guest not authenticated' }, { status: 401 });
    }
    if (!medicineId || typeof medicineId !== 'string') {
        return NextResponse.json({ success: false, error: 'medicineId is required and must be a string' }, { status: 400 });
    }
    const cart = await GuestCart.findOne({ guestId });
    if (!cart) {
        return NextResponse.json({ success: false, error: 'Guest cart not found' }, { status: 404 });
    }
    cart.items = cart.items.filter((item: any) => item.medicineId.toString() !== medicineId);
    await cart.save();
    return NextResponse.json({ success: true, cart, message: 'Remove from guest cart successfully' });
}
