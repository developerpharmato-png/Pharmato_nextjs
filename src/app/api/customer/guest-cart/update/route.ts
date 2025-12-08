
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import GuestCart from '@/models/GuestCart';

/**
 * @swagger
 * /api/customer/guest-cart/update:
 *   post:
 *     summary: Update guest cart item quantity
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
 *         description: Guest cart item updated
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
    try {
        await connectDB();
        const body = await request.json();
        const { guestId, medicineId, quantity } = body;
        if (!guestId || typeof guestId !== 'string') {
            return NextResponse.json({ success: false, error: 'guestId is required and must be a string' }, { status: 401 });
        }
        if (!medicineId || typeof medicineId !== 'string') {
            return NextResponse.json({ success: false, error: 'medicineId is required and must be a string' }, { status: 400 });
        }
        if (typeof quantity !== 'number' || quantity === 0) {
            return NextResponse.json({ success: false, error: 'quantity must be a non-zero integer' }, { status: 400 });
        }
        let cart = await GuestCart.findOne({ guestId });
        if (!cart) {
            return NextResponse.json({ success: false, error: 'Guest cart not found' }, { status: 404 });
        }
        const itemIndex = cart.items.findIndex((item: any) => item.medicineId.toString() === medicineId);
        if (itemIndex > -1) {
            cart.items[itemIndex].quantity += quantity;
            // Remove item if quantity goes to zero or below
            if (cart.items[itemIndex].quantity <= 0) {
                cart.items.splice(itemIndex, 1);
            }
            await cart.save();
            cart = await GuestCart.findOne({ guestId }).populate({
                path: 'items.medicineId',
                select: '_id name manufacturer isPrescription mrp price images'
            });
            return NextResponse.json({ success: true, cart });
        }
        // Only add if quantity is positive
        if (quantity > 0) {
            cart.items.push({ medicineId, quantity });
            await cart.save();
            cart = await GuestCart.findOne({ guestId }).populate({
                path: 'items.medicineId',
                select: '_id name manufacturer isPrescription mrp price images'
            });
            return NextResponse.json({ success: true, cart });
        }
        return NextResponse.json({ success: false, error: 'Item not found in guest cart and quantity is negative' }, { status: 404 });
    } catch (error) {
        console.error('Guest cart update error:', error);
        const errorMessage = typeof error === 'object' && error !== null && 'message' in error ? (error as any).message : String(error);
        return NextResponse.json({ success: false, error: 'Internal Server Error', details: errorMessage }, { status: 500 });
    }
}
