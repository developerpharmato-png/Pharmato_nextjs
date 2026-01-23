/**
 * @swagger
 * /api/customer/cart/update:
 *   post:
 *     summary: Update cart item quantity
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
 *                 example: 3
 *     responses:
 *       200:
 *         description: Cart item updated
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
import { updateCartCountInFirebase } from '@/utils/updateCartCountInFirebase';

export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        // Ensure Medicine model is registered after dbConnect
        const Medicine = (await import('@/models/Medicine')).default;
        const body = await request.json();
        const { userId, storeId, medicineId, quantity } = body;
        if (!userId || typeof userId !== 'string') {
            return NextResponse.json({ success: false, error: 'userId is required and must be a string' }, { status: 401 });
        }
        if (!storeId || typeof storeId !== 'string') {
            return NextResponse.json({ success: false, error: 'storeId is required and must be a string' }, { status: 400 });
        }
        if (!medicineId || typeof medicineId !== 'string') {
            return NextResponse.json({ success: false, error: 'medicineId is required and must be a string' }, { status: 400 });
        }
        if (typeof quantity !== 'number' || quantity === 0) {
            return NextResponse.json({ success: false, error: 'quantity must be a non-zero integer' }, { status: 400 });
        }
        let cart = await Cart.findOne({ userId, storeId });
        if (!cart) {
            return NextResponse.json({ success: false, error: 'Cart not found' }, { status: 404 });
        }
        const itemIndex = cart.items.findIndex((item: any) => item.medicineId.toString() === medicineId);
        if (itemIndex > -1) {
            cart.items[itemIndex].quantity += quantity;
            // Remove item if quantity goes to zero or below
            if (cart.items[itemIndex].quantity <= 0) {
                cart.items.splice(itemIndex, 1);
            }
            await cart.save();

            // Update cart count in Firebase
            updateCartCountInFirebase({ userId, storeId }); // fire-and-forget, don't await

            cart = await Cart.findOne({ userId, storeId }).populate({
                path: 'items.medicineId',
                select: '_id name categoryId subCategoryId manufacturer isPrescription mrp price discount images stock coverImage crossSellProducts'
            });
            // Build medicineId -> cart quantity map
            const cartQuantityMap: Record<string, number> = {};
            for (const item of cart.items) {
                cartQuantityMap[item.medicineId._id?.toString?.() || item.medicineId.toString()] = item.quantity;
            }
            // Collect all crossSellProduct IDs from all medicines in the cart
            const allCrossSellIdsSet = new Set<string>();
            for (const item of cart.items) {
                if (item.medicineId.crossSellProducts && Array.isArray(item.medicineId.crossSellProducts)) {
                    item.medicineId.crossSellProducts.forEach((id: any) => allCrossSellIdsSet.add(id.toString()));
                }
            }
            const allCrossSellIds = Array.from(allCrossSellIdsSet);
            let allCrossSellProducts: any[] = [];
            if (allCrossSellIds.length > 0) {
                const crossSellMeds = await Medicine.find({ _id: { $in: allCrossSellIds } }, '_id name manufacturer mrp price images discount stock').lean();
                allCrossSellProducts = crossSellMeds.map((prod: any) => {
                    const inCart = cartQuantityMap[prod._id.toString()] || 0;
                    return {
                        ...prod,
                        isInCart: inCart > 0,
                        cartQuantity: inCart
                    };
                }).filter((prod: any) => !prod.isInCart);
            }
            // Items array remains unchanged except for .toObject()
            const itemsWithoutCrossSell = cart.items.map((item: any) => item.toObject());
            const isPrescriptionRequired = itemsWithoutCrossSell.some((item: any) => item.medicineId && item.medicineId.isPrescription === true);


            return NextResponse.json({ success: true, message: 'Cart Updated', cart: { ...cart.toObject(), items: itemsWithoutCrossSell, crossSellProducts: allCrossSellProducts, isPrescriptionRequired } });
        }
        // Only add if quantity is positive
        if (quantity > 0) {
            cart.items.push({ medicineId, quantity });
            await cart.save();

            // Update cart count in Firebase
            updateCartCountInFirebase({ userId, storeId }); // fire-and-forget, don't await

            cart = await Cart.findOne({ userId, storeId }).populate({
                path: 'items.medicineId',
                select: '_id name categoryId subCategoryId manufacturer isPrescription mrp price discount stock images coverImage crossSellProducts'
            });
            // Build medicineId -> cart quantity map
            const cartQuantityMap: Record<string, number> = {};
            for (const item of cart.items) {
                cartQuantityMap[item.medicineId._id?.toString?.() || item.medicineId.toString()] = item.quantity;
            }
            // Collect all crossSellProduct IDs from all medicines in the cart
            const allCrossSellIdsSet = new Set<string>();
            for (const item of cart.items) {
                if (item.medicineId.crossSellProducts && Array.isArray(item.medicineId.crossSellProducts)) {
                    item.medicineId.crossSellProducts.forEach((id: any) => allCrossSellIdsSet.add(id.toString()));
                }
            }
            const allCrossSellIds = Array.from(allCrossSellIdsSet);
            let allCrossSellProducts: any[] = [];
            if (allCrossSellIds.length > 0) {
                const crossSellMeds = await Medicine.find({ _id: { $in: allCrossSellIds } }, '_id name manufacturer mrp price images discount stock').lean();
                allCrossSellProducts = crossSellMeds.map((prod: any) => {
                    const inCart = cartQuantityMap[prod._id.toString()] || 0;
                    return {
                        ...prod,
                        isInCart: inCart > 0,
                        cartQuantity: inCart
                    };
                });
            }
            // Items array remains unchanged except for .toObject()
            const itemsWithoutCrossSell = cart.items.map((item: any) => item.toObject());
            const isPrescriptionRequired = itemsWithoutCrossSell.some((item: any) => item.medicineId && item.medicineId.isPrescription === true);


            return NextResponse.json({ success: true, message: 'Cart Updated', cart: { ...cart.toObject(), items: itemsWithoutCrossSell, crossSellProducts: allCrossSellProducts, isPrescriptionRequired } });
        }
        return NextResponse.json({ success: false, error: 'Item not found in cart and quantity is negative' }, { status: 404 });
    } catch (error) {
        console.error('Cart update error:', error);
        const errorMessage = typeof error === 'object' && error !== null && 'message' in error ? (error as any).message : String(error);
        return NextResponse.json({ success: false, error: 'Internal Server Error', details: errorMessage }, { status: 500 });
    }
}
