
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import GuestCart from '@/models/GuestCart';
import mongoose from 'mongoose';
import { getDb } from '@/utils/firebase.helper';
const db = getDb();
await connectDB();


export async function updateGuestCartCountInFirebase({ guestId, storeId }: { guestId?: string; storeId?: string }) {

    if (!guestId || !storeId) return;

    // 🔥 LIGHT & FAST aggregation (NO lookup)
    const cartAgg = await GuestCart.aggregate([
        {
            $match: {
                guestId: guestId,
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
        .ref(`cart/${guestId}/${storeId}`)
        .update({
            count
        });

}

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
 *               storeId:
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
        const body = await request.json();
        const { guestId, storeId, medicineId, quantity } = body;
        if (!guestId || typeof guestId !== 'string') {
            return NextResponse.json({ success: false, error: 'guestId is required and must be a string' }, { status: 401 });
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
        let cart = await GuestCart.findOne({ guestId, storeId });
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
            
            // Update cart count in Firebase
            updateGuestCartCountInFirebase({ guestId, storeId }); // fire-and-forget, don't await

            cart = await GuestCart.findOne({ guestId }).populate({
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
                const crossSellMeds = await (await import('@/models/Medicine')).default.find({ _id: { $in: allCrossSellIds } }, '_id name manufacturer mrp price stock images discount').lean();
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
            updateGuestCartCountInFirebase({ guestId, storeId }); // fire-and-forget, don't await

            cart = await GuestCart.findOne({ guestId }).populate({
                path: 'items.medicineId',
                select: '_id name categoryId subCategoryId manufacturer isPrescription mrp price stock discount images coverImage crossSellProducts'
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
                const crossSellMeds = await (await import('@/models/Medicine')).default.find({ _id: { $in: allCrossSellIds } }, '_id name manufacturer mrp price stock images discount').lean();
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
        return NextResponse.json({ success: false, error: 'Item not found in guest cart and quantity is negative' }, { status: 404 });
    } catch (error) {
        console.error('Guest cart update error:', error);
        const errorMessage = typeof error === 'object' && error !== null && 'message' in error ? (error as any).message : String(error);
        return NextResponse.json({ success: false, error: 'Internal Server Error', details: errorMessage }, { status: 500 });
    }
}
