import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import GuestCart from '@/models/GuestCart';
import Cart from '@/models/Cart';
import Medicine from '@/models/Medicine';
import { updateCartCountInFirebase } from '@/utils/updateCartCountInFirebase';
const mongoose = require('mongoose');


/**
 * @swagger
 * /api/customer/cart/merge:
 *   post:
 *     summary: Merge guest cart into user cart (customer)
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

        const userCart = await Cart.findOneAndUpdate(
            { userId, storeId },
            { $setOnInsert: { items: [] } },
            { new: true, upsert: true }
        );

        // // Merge logic: add/merge quantities for this store only
        // guestCart.items.forEach((guestItem: any) => {
        //     const userItemIndex = userCart.items.findIndex((item: any) => item.medicineId.toString() === guestItem.medicineId.toString());
        //     if (userItemIndex > -1) {
        //         userCart.items[userItemIndex].quantity += guestItem.quantity;
        //     } else {
        //         userCart.items.push({ medicineId: guestItem.medicineId, quantity: guestItem.quantity });
        //     }
        // });

        const mergedGuestItemsMap = new Map<string, number>();

        for (const item of guestCart.items) {
            const medId = item.medicineId.toString();
            mergedGuestItemsMap.set(
                medId,
                (mergedGuestItemsMap.get(medId) || 0) + item.quantity
            );
        }

        for (const [medicineId, quantity] of mergedGuestItemsMap.entries()) {
            const index = userCart.items.findIndex(
                (item: any) => item.medicineId.toString() === medicineId
            );

            if (index > -1) {
                userCart.items[index].quantity += quantity;
            } else {
                userCart.items.push({
                    medicineId,
                    quantity
                });
            }
        }

        // 🔥 YAHAN save chahiye (kyunki items change hue)
        await userCart.save();
        await userCart.populate('items.medicineId');

        // Only delete the guest cart for this store
        await GuestCart.deleteOne({ guestId, storeId });
        
        // Update cart count in Firebase
        updateCartCountInFirebase({ userId, storeId }); // fire-and-forget, don't await

        // Build medicineId -> cart quantity map
        const cartQuantityMap: Record<string, number> = {};
        for (const item of userCart.items) {
            cartQuantityMap[item.medicineId._id ? item.medicineId._id.toString() : item.medicineId.toString()] = item.quantity;
        }

        // Collect all crossSellProduct IDs from all medicines in the cart
        const allCrossSellIdsSet = new Set<string>();
        for (const item of userCart.items) {
            const med = item.medicineId && item.medicineId._id ? item.medicineId : null;
            if (med && med.crossSellProducts && Array.isArray(med.crossSellProducts)) {
                med.crossSellProducts.forEach((id: any) => allCrossSellIdsSet.add(id.toString()));
            }
        }
        const allCrossSellIds = Array.from(allCrossSellIdsSet).map(id => new mongoose.Types.ObjectId(id));
        let allCrossSellProducts: any[] = [];
        if (allCrossSellIds.length > 0) {
            const crossSellMeds = await Medicine.find(
                { _id: { $in: allCrossSellIds } },
                '_id name manufacturer mrp price stock images discount'
            ).lean();

            allCrossSellProducts = crossSellMeds.map((prod: any) => {
                const inCart = cartQuantityMap[prod._id.toString()] || 0;
                return {
                    ...prod,
                    isInCart: inCart > 0,
                    cartQuantity: inCart
                };
            }).filter((prod: any) => !prod.isInCart);
        }

        const itemsWithDetails = await Promise.all(userCart.items.map(async (item: any) => {
            const med = item.medicineId && item.medicineId._id ? item.medicineId : null;
            return {
                ...item.toObject(),
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

        // Determine if any item requires a prescription
        const isPrescriptionRequired = itemsWithDetails.some((item: any) => item.medicineId && item.medicineId.isPrescription === true);

        return NextResponse.json({
            success: true,
            message: 'Cart fetched successfully',
            cart: {
                ...userCart.toObject(),
                items: itemsWithDetails,
                crossSellProducts: allCrossSellProducts,
                isPrescriptionRequired,
                medicines: undefined // remove medicines array from response
            }
        });
        
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
