/**
 * @swagger
 * /api/customer/cart/clear:
 *   post:
 *     summary: Clear all items from cart
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
 *                 description: User's ObjectId
 *               storeId:
 *                 type: string
 *                 description: Store's ObjectId
 *     responses:
 *       200:
 *         description: Cart cleared
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
import mongoose from 'mongoose';
import { getDb } from '@/utils/firebase.helper';
import connectDB from '@/lib/mongodb';
// 🔥 Firebase update
const db = getDb();
await connectDB();


async function updateCartCountInFirebase({ userId, storeId }: { userId?: string; storeId?: string }) {

    if (!userId || !storeId) return;

    // 🔥 LIGHT & FAST aggregation (NO lookup)
    const cartAgg = await Cart.aggregate([
        {
            $match: {
                userId: new mongoose.Types.ObjectId(userId),
                storeId: new mongoose.Types.ObjectId(storeId)
            }
        },
        {
            $project: {
                _id: 0,
                count: { $size: "$items" }
            }
        }
    ]);

    const count = cartAgg?.[0]?.count || 0;

    await db
        .ref(`cart/${userId}/${storeId}`)
        .update({
            count
        });

}

export async function POST(request: NextRequest) {
    const body = await request.json();
    const userId = body.userId || request.headers.get('x-user-id');
    const storeId = body.storeId;
    if (!userId) {
        return NextResponse.json({ success: false, error: 'User not authenticated' }, { status: 401 });
    }
    if (!storeId) {
        return NextResponse.json({ success: false, error: 'storeId is required' }, { status: 400 });
    }
    const cart = await Cart.findOne({ userId, storeId });
    if (!cart) {
        return NextResponse.json({ success: false, error: 'Cart not found' }, { status: 404 });
    }
    cart.items = [];
    await cart.save();
    
    // Update cart count in Firebase
    updateCartCountInFirebase({ userId, storeId }); // fire-and-forget, don't await

    return NextResponse.json({ success: true, message: 'Cart cleared', cart });
}
