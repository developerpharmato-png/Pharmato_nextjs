/**
 * @swagger
 * /api/customer/cart/add-cross-sell:
 *   post:
 *     summary: Add cross-sell product to cart
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
 *                 example: "USER_OBJECT_ID"
 *               storeId:
 *                 type: string
 *                 example: "STORE_OBJECT_ID"
 *               medicineId:
 *                 type: string
 *                 example: "MEDICINE_OBJECT_ID"
 *               quantity:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Item added/updated and cart returned
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
 *                   $ref: '#/components/schemas/Cart'
 */

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Cart from '@/models/Cart';
import Medicine from '@/models/Medicine';
import mongoose from 'mongoose';
import { updateCartCountInFirebase } from '@/utils/updateCartCountInFirebase';
import connectDB from '@/lib/mongodb';
await connectDB();

export async function POST(request: NextRequest) {

    try {
        const body = await request.json();

        const { userId, storeId, medicineId, quantity } = body;

        if (!userId || typeof userId !== 'string') {
            return NextResponse.json({ success: false, error: 'userId is required and must be a string' }, { status: 400 });
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

        const medicine = await Medicine.findById(medicineId).select('_id');
        if (!medicine) {
            return NextResponse.json({ success: false, error: 'Medicine not found' }, { status: 404 });
        }

        let cart = await Cart.findOne({ userId, storeId });
        let message = 'Cart Updated';

        if (!cart) {
            // Create cart and add item if quantity > 0
            if (quantity > 0) {
                cart = await Cart.create({ userId, storeId, items: [{ medicineId, quantity }] });
                message = 'Added to Cart';
            } else {
                // Negative quantity on empty cart is a no-op
                cart = await Cart.create({ userId, storeId, items: [] });
                message = 'Removed from Cart';
            }
        } else {
            const itemIndex = cart.items.findIndex((item: any) => item.medicineId.toString() === medicineId);
            if (itemIndex > -1) {
                cart.items[itemIndex].quantity += quantity;
                if (cart.items[itemIndex].quantity <= 0) {
                    cart.items.splice(itemIndex, 1);
                    message = 'Removed from Cart';
                } else {
                    message = quantity > 0 ? 'Cart Updated' : 'Removed from Cart';
                }
            } else if (quantity > 0) {
                cart.items.push({ medicineId, quantity });
                message = 'Added to Cart';
            } else {
                // Negative quantity for non-existing item, treat as no-op remove
                message = 'Removed from Cart';
            }
            await cart.save();
        }

        // Update cart count in Firebase
        updateCartCountInFirebase({ userId, storeId }); // fire-and-forget, don't await

        // Re-aggregate cart exactly like cart/get to mirror response
        const cartAgg = await Cart.aggregate([
            {
                $match: {
                    userId: new mongoose.Types.ObjectId(userId),
                    storeId: new mongoose.Types.ObjectId(storeId)
                }
            },
            {
                $lookup: {
                    from: 'medicines',
                    localField: 'items.medicineId',
                    foreignField: '_id',
                    as: 'medicines'
                }
            }
        ]);

        const cartDoc = cartAgg?.[0] || null;
        if (!cartDoc) {
            return NextResponse.json({ success: true, message: 'Cart fetched successfully', cart: null });
        }

        const cartQuantityMap: Record<string, number> = {};
        for (const item of cartDoc.items) {
            cartQuantityMap[item.medicineId.toString()] = item.quantity;
        }

        const medicines = cartDoc.medicines || [];

        const allCrossSellIdsSet = new Set<string>();
        for (const item of cartDoc.items) {
            const med = medicines.find((m: any) => m._id.toString() === item.medicineId.toString());
            if (med && med.crossSellProducts && Array.isArray(med.crossSellProducts)) {
                med.crossSellProducts.forEach((id: any) => allCrossSellIdsSet.add(id.toString()));
            }
        }
        const allCrossSellIds = Array.from(allCrossSellIdsSet).map(id => new mongoose.Types.ObjectId(id));
        let allCrossSellProducts: any[] = [];
        if (allCrossSellIds.length > 0) {
            const crossSellMeds = await mongoose.model('Medicine').find({ _id: { $in: allCrossSellIds } },
                '_id name manufacturer mrp price stock images discount').lean();
            allCrossSellProducts = crossSellMeds.map((prod: any) => {
                const inCart = cartQuantityMap[prod._id.toString()] || 0;
                return {
                    ...prod,
                    isInCart: inCart > 0,
                    cartQuantity: inCart
                };
            }).filter((prod: any) => !prod.isInCart);
        }

        const itemsWithDetails = await Promise.all(cartDoc.items.map(async (item: any) => {
            const med = medicines.find((m: any) => m._id.toString() === item.medicineId.toString());
            return {
                ...item,
                medicineId: med ? {
                    _id: med._id,
                    name: med.name,
                    categoryId: med.categoryId,
                    subCategoryId: med.subCategoryId,
                    manufacturer: med.manufacturer,
                    isPrescription: med.isPrescription,
                    price: med.price,
                    mrp: med.mrp,
                    discount: med.discount,
                    stock: med.stock,
                    images: med.images,
                    coverImage: med.coverImage
                } : item.medicineId
            };
        }));

        const isPrescriptionRequired = itemsWithDetails.some((item: any) => item.medicineId && item.medicineId.isPrescription === true);


        return NextResponse.json({
            success: true,
            message,
            cart: {
                ...cartDoc,
                items: itemsWithDetails,
                crossSellProducts: allCrossSellProducts,
                isPrescriptionRequired,
                medicines: undefined
            }
        });
    } catch (err: any) {
        console.error('Cross-sell add error:', err);
        return NextResponse.json({ success: false, error: 'Internal server error', details: err.message }, { status: 500 });
    }
}
