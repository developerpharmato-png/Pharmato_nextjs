import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Cart from '@/models/Cart';
import Medicine from '@/models/Medicine';
import mongoose from 'mongoose';
import { updateCartCountInFirebase } from '@/utils/updateCartCountInFirebase';
import connectDB from '@/lib/mongodb';
await connectDB();

/**
 * @swagger
 * /api/customer/cart/reorder:
 *   post:
 *     summary: Reorder items for a customer (add to cart)
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
 *               storeId:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     medicineId:
 *                       type: string
 *                     quantity:
 *                       type: number
 *     responses:
 *       200:
 *         description: Items reordered and added to cart
 *       400:
 *         description: Invalid input
 */

export async function POST(req: NextRequest) {
    const { userId, storeId, items } = await req.json();
    if (!userId || !storeId || !Array.isArray(items) || items.length === 0) {
        return NextResponse.json({ success: false, message: 'userId, storeId, and items are required' }, { status: 400 });
    }
    // Validate and filter items
    const validItems = [];
    for (const item of items) {
        if (!item.medicineId || typeof item.quantity !== 'number' || item.quantity <= 0) continue;
        // Optionally, check if medicine exists and is in stock
        const med = await Medicine.findById(item.medicineId).lean();
        // Ensure med is a single document (not an array) and exists
        if (!med || Array.isArray(med)) {
            return NextResponse.json({ success: false, message: `Medicine not found: ${item.medicineId}` }, { status: 400 });
        }
        const medAny: any = med;
        if (typeof medAny.stock === 'number' && item.quantity > medAny.stock) {
            return NextResponse.json({ success: false, message: `Stock not available for medicine: ${medAny.name}` }, { status: 400 });
        }
        validItems.push({ medicineId: item.medicineId, quantity: item.quantity });
    }
    if (validItems.length === 0) {
        return NextResponse.json({ success: false, message: 'No valid items to reorder' }, { status: 400 });
    }
    // Upsert cart for user and store
    let cart = await Cart.findOne({ userId, storeId });
    if (!cart) {
        cart = await Cart.create({ userId, storeId, items: [] });
    }
    else if (cart.items && cart.items.length > 0) {
        // If cart already has items, clear them first as requested
        cart.items = [];
    }
    // Add or update items in cart
    for (const reorderItem of validItems) {
        const idx = cart.items.findIndex((item: any) => item.medicineId.toString() === reorderItem.medicineId.toString());
        if (idx > -1) {
            cart.items[idx].quantity = reorderItem.quantity;
        } else {
            cart.items.push({ medicineId: reorderItem.medicineId, quantity: reorderItem.quantity });
        }
    }
    await cart.save();
    await cart.populate('items.medicineId');
    
    // Update cart count in Firebase
    updateCartCountInFirebase({ userId, storeId }); // fire-and-forget, don't await

    return NextResponse.json({ success: true, message: 'Items reordered and added to cart', cart });
}
