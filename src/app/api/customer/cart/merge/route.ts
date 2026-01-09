import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import GuestCart from '@/models/GuestCart';
import Cart from '@/models/Cart';

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

        let checkUserCart = await Cart.findOne({ userId, storeId });

        if (!checkUserCart) {
            checkUserCart = await Cart.create({ userId, storeId, items: [] });
            await checkUserCart.save();
        }

        let userCart = await Cart.findOne({ userId, storeId });

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

        // Build medicineId -> cart quantity map
        const cartQuantityMap: Record<string, number> = {};
        for (const item of userCart.items) {
            cartQuantityMap[item.medicineId._id ? item.medicineId._id.toString() : item.medicineId.toString()] = item.quantity;
        }

        // Attach medicine details and crossSellProducts
        const medicines = userCart.items.map((item: any) => item.medicineId && item.medicineId._id ? item.medicineId : null).filter(Boolean);

        // Collect all crossSellProduct IDs from all medicines in the cart
        const allCrossSellIdsSet = new Set<string>();
        for (const item of userCart.items) {
            const med = item.medicineId && item.medicineId._id ? item.medicineId : null;
            if (med && med.crossSellProducts && Array.isArray(med.crossSellProducts)) {
                med.crossSellProducts.forEach((id: any) => allCrossSellIdsSet.add(id.toString()));
            }
        }
        const mongoose = require('mongoose');
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
