/**
 * @swagger
 * /api/customer/cart/remove:
 *   post:
 *     summary: Remove item from cart
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
 *               medicineId:
 *                 type: string
 *                 description: Medicine ObjectId to remove
 *     responses:
 *       200:
 *         description: Cart item removed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 cart:
 *                   $ref: '#/components/schemas/Cart'
 *       400:
 *         description: Missing or invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 *       401:
 *         description: User not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 *       404:
 *         description: Cart not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 */

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Cart from '@/models/Cart';
import mongoose from "mongoose";
import Medicine from '@/models/Medicine';

export async function POST(request: NextRequest) {
    await dbConnect();
    const body = await request.json();
    const { userId, medicineId } = body;
    if (!userId) {
        return NextResponse.json({ success: false, error: 'User not authenticated' }, { status: 401 });
    }
    if (!medicineId || typeof medicineId !== 'string') {
        return NextResponse.json({ success: false, error: 'medicineId is required and must be a string' }, { status: 400 });
    }
    // Remove item from cart, then re-aggregate for medicine details
    const cartDoc = await Cart.findOne({ userId });
    if (!cartDoc) {
        return NextResponse.json({ success: false, error: 'Cart not found' }, { status: 404 });
    }
    cartDoc.items = cartDoc.items.filter((item: any) => item.medicineId.toString() !== medicineId);
    await cartDoc.save();


    // Get cart with medicine details
    const cartAgg = await Cart.aggregate([
        {
            $match: {
                _id: cartDoc._id
            }
        },
        {
            $lookup: {
                from: "medicines",
                localField: "items.medicineId",
                foreignField: "_id",
                as: "medicines"
            }
        }
    ]);

    const cart = cartAgg?.[0] || null;
    if (!cart) {
        return NextResponse.json({ success: true, cart: null, message: 'Removed from Cart' });
    }

    // Build medicineId -> cart quantity map
    const cartQuantityMap: Record<string, number> = {};
    for (const item of cart.items) {
        cartQuantityMap[item.medicineId.toString()] = item.quantity;
    }

    // Attach medicine details and collect all unique crossSellProducts
    const medicines = cart.medicines || [];
    // Collect all crossSellProduct IDs from all medicines in the cart
    const allCrossSellIdsSet = new Set<string>();
    for (const item of cart.items) {
        const med = medicines.find((m: any) => m._id.toString() === item.medicineId.toString());
        if (med && med.crossSellProducts && Array.isArray(med.crossSellProducts)) {
            med.crossSellProducts.forEach((id: any) => allCrossSellIdsSet.add(id.toString()));
        }
    }
    const allCrossSellIds = Array.from(allCrossSellIdsSet).map(id => new mongoose.Types.ObjectId(id));
    let allCrossSellProducts: any[] = [];
    if (allCrossSellIds.length > 0) {
        const crossSellMeds = await mongoose.model('Medicine').find({ _id: { $in: allCrossSellIds } },
            '_id name manufacturer mrp price images stock discount').lean();
        allCrossSellProducts = crossSellMeds.map((prod: any) => {
            const inCart = cartQuantityMap[prod._id.toString()] || 0;
            return {
                ...prod,
                isInCart: inCart > 0,
                cartQuantity: inCart
            };
        }).filter((prod: any) => !prod.isInCart);
    }

    const itemsWithDetails = await Promise.all(cart.items.map(async (item: any) => {
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
        cart: {
            ...cart,
            items: itemsWithDetails,
            crossSellProducts: allCrossSellProducts,
            isPrescriptionRequired,
            medicines: undefined // remove medicines array from response
        },
        message: 'Removed from Cart'
    });
}
