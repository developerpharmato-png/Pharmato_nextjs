import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import GuestCart from '@/models/GuestCart';
import Cart from '@/models/Cart';

/**
 * @swagger
 * /api/cart/merge:
 *   post:
 *     summary: Merge guest cart into user cart
 *     tags:
 *       - Cart
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               guestId:
 *                 type: string
 *               userId:
 *                 type: string
 *               storeId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Guest cart merged into user cart
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Cart'
 */
export async function POST(request: NextRequest) {
    try {
        await connectDB();
        const body = await request.json();
        const { guestId, userId, storeId } = body;
        if (!guestId || !userId || !storeId) {
            return NextResponse.json({ success: false, message: 'Invalid input', data: null }, { status: 400 });
        }
        // Only merge guest cart for the given storeId
        const guestCart = await GuestCart.findOne({ guestId, storeId });
        if (!guestCart || !guestCart.items || guestCart.items.length === 0) {
            return NextResponse.json({ success: true, message: 'No items to merge', data: null });
        }
        let userCart = await Cart.findOne({ userId, storeId });
        if (!userCart) {
            userCart = await Cart.create({ userId, storeId, items: [] });
        }
        // Merge logic: add/merge quantities for this store only
        guestCart.items.forEach((guestItem: any) => {
            const userItemIndex = userCart.items.findIndex((item: any) => item.medicineId.toString() === guestItem.medicineId.toString());
            if (userItemIndex > -1) {
                userCart.items[userItemIndex].quantity += guestItem.quantity;
            } else {
                userCart.items.push({ medicineId: guestItem.medicineId, quantity: guestItem.quantity });
            }
        });
        await userCart.save();
        await userCart.populate('items.medicineId');
        // Only delete the guest cart for this store
        await GuestCart.deleteOne({ guestId, storeId });
        return NextResponse.json({ success: true, message: 'Guest cart merged into user cart', data: userCart });
    } catch (error) {
        let errorMessage = 'Error merging carts';
        if (error && typeof error === 'object' && 'message' in error) {
            errorMessage = String((error as any).message);
        } else {
            errorMessage = String(error);
        }
        return NextResponse.json({ success: false, message: errorMessage, data: null }, { status: 500 });
    }
}
