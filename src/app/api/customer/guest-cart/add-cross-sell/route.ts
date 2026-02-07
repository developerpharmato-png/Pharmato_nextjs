/**
 * @swagger
 * /api/customer/guest-cart/add-cross-sell:
 *   post:
 *     summary: Add cross-sell product to guest cart
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
 *                 example: "GUEST_UUID_OR_TOKEN"
 *               storeId:
 *                 type: string
 *                 example: "STORE_ID"
 *               medicineId:
 *                 type: string
 *                 example: "MEDICINE_OBJECT_ID"
 *               quantity:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Item added/updated and guest cart returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 cart:
 *                   $ref: '#/components/schemas/GuestCart'
 */

import { NextRequest, NextResponse } from 'next/server';
import GuestCart from '@/models/GuestCart';
import mongoose from 'mongoose';
import { updateGuestCartCountInFirebase } from '@/utils/updateGuestCartCountInFirebase';
import connectDB from '@/lib/mongodb';
await connectDB();

export async function POST(request: NextRequest) {
    try {

        const body = await request.json();

        const { guestId, storeId, medicineId, quantity } = body;

        if (!guestId || typeof guestId !== 'string') {
            return NextResponse.json({ success: false, error: 'guestId is required and must be a string' }, { status: 400 });
        }
        if (!storeId || typeof storeId !== 'string') {
            return NextResponse.json({ success: false, error: 'storeId is required and must be a string' }, { status: 400 });
        }
        if (!medicineId || typeof medicineId !== 'string') {
            return NextResponse.json({ success: false, error: 'medicineId is required and must be a string' }, { status: 400 });
        }
        if (!mongoose.Types.ObjectId.isValid(medicineId)) {
            return NextResponse.json({ success: false, error: 'medicineId must be a valid ObjectId' }, { status: 400 });
        }
        if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity === 0) {
            return NextResponse.json({ success: false, error: 'quantity must be a non-zero integer' }, { status: 400 });
        }

        // Ensure medicine exists
        const Medicine = (await import('@/models/Medicine')).default;
        const medicine = await Medicine.findById(medicineId).select('_id');
        if (!medicine) {
            return NextResponse.json({ success: false, error: 'Medicine not found' }, { status: 404 });
        }

        let cart = await GuestCart.findOne({ guestId, storeId });
        let message = 'Cart Updated';

        if (!cart) {
            if (quantity > 0) {
                cart = await GuestCart.create({ guestId, storeId, items: [{ medicineId, quantity }] });
                message = 'Cart Updated';
            } else {
                // Negative quantity on empty cart -> create empty cart so downstream flows work
                cart = await GuestCart.create({ guestId, storeId, items: [] });
                message = 'Cart Updated';
            }
        } else {
            const idx = cart.items.findIndex((item: any) => item.medicineId.toString() === medicineId);
            if (idx > -1) {
                cart.items[idx].quantity += quantity;
                if (cart.items[idx].quantity <= 0) {
                    cart.items.splice(idx, 1);
                    message = 'Cart Updated';
                } else {
                    message = quantity > 0 ? 'Cart Updated' : 'Cart Updated';
                }
            } else if (quantity > 0) {
                cart.items.push({ medicineId, quantity });
                message = 'Cart Updated';
            } else {
                message = 'Cart Updated';
            }
            await cart.save();
        }
        
        // Update cart count in Firebase
        updateGuestCartCountInFirebase({ guestId, storeId }); // fire-and-forget, don't await

        // Populate medicines and compute crossSellProducts similar to guest-cart/update
        cart = await GuestCart.findOne({ guestId, storeId }).populate({
            path: 'items.medicineId',
            select: '_id name categoryId subCategoryId manufacturer isPrescription mrp price discount stock images coverImage crossSellProducts'
        });

        if (!cart) {
            return NextResponse.json({ success: true, message: 'Cart fetched successfully', cart: null });
        }

        // Build medicineId -> cart quantity map
        const cartQuantityMap: Record<string, number> = {};
        for (const item of cart.items as any[]) {
            const key = (item.medicineId as any)._id?.toString?.() || (item.medicineId as any).toString();
            cartQuantityMap[key] = item.quantity;
        }

        // Collect cross-sell IDs from all items
        const allCrossSellIdsSet = new Set<string>();
        for (const item of cart.items as any[]) {
            const med: any = item.medicineId;
            if (med && Array.isArray(med.crossSellProducts)) {
                med.crossSellProducts.forEach((id: any) => allCrossSellIdsSet.add(id.toString()));
            }
        }

        const allCrossSellIds = Array.from(allCrossSellIdsSet);
        let allCrossSellProducts: any[] = [];
        if (allCrossSellIds.length > 0) {
            const crossSellMeds = await Medicine.find({ _id: { $in: allCrossSellIds } }, '_id name manufacturer mrp price stock images discount').lean();
            allCrossSellProducts = crossSellMeds
                .map((prod: any) => {
                    const inCart = cartQuantityMap[prod._id.toString()] || 0;
                    return { ...prod, isInCart: inCart > 0, cartQuantity: inCart };
                })
                .filter((prod: any) => !prod.isInCart);
        }

        // Build items array but remove crossSellProducts from each medicineId object
        const itemsWithoutCrossSell = (cart.items as any[]).map((item: any) => {
            const obj = item.toObject();
            if (obj.medicineId && typeof obj.medicineId === 'object') {
                delete obj.medicineId.crossSellProducts;
            }
            return obj;
        });
        const isPrescriptionRequired = itemsWithoutCrossSell.some((item: any) => item.medicineId && item.medicineId.isPrescription === true);
           

        return NextResponse.json({
            success: true,
            message,
            cart: { ...cart.toObject(), items: itemsWithoutCrossSell, crossSellProducts: allCrossSellProducts, isPrescriptionRequired }
        });
    } catch (error) {
        console.error('Guest cross-sell add error:', error);
        const errorMessage = typeof error === 'object' && error !== null && 'message' in error ? (error as any).message : String(error);
        return NextResponse.json({ success: false, error: 'Internal Server Error', details: errorMessage }, { status: 500 });
    }
}
