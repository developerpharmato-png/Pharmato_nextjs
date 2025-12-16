/**
 * @swagger
 * /api/customer/cart/get:
 *   post:
 *     summary: Get cart for user
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
 *     responses:
 *       200:
 *         description: Cart fetched
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


// import { NextRequest, NextResponse } from 'next/server';

import dbConnect from '@/lib/mongodb';
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import Cart from "@/models/Cart";

export async function POST(request: NextRequest) {
    await dbConnect();

    try {
        const body = await request.json();
        const { userId } = body;

        if (!userId) {
            return NextResponse.json(
                { success: false, error: "User not authenticated" },
                { status: 401 }
            );
        }


        // Get cart with medicine details
        const cartAgg = await Cart.aggregate([
            {
                $match: {
                    userId: new mongoose.Types.ObjectId(userId)
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
            return NextResponse.json({ success: true, message: 'Cart fetched successfully', cart: null });
        }

        // Build medicineId -> cart quantity map
        const cartQuantityMap: Record<string, number> = {};
        for (const item of cart.items) {
            cartQuantityMap[item.medicineId.toString()] = item.quantity;
        }

        // Attach medicine details and crossSellProducts
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

        // Determine if any item requires a prescription
        const isPrescriptionRequired = itemsWithDetails.some((item: any) => item.medicineId && item.medicineId.isPrescription === true);

        return NextResponse.json({
            success: true,
            message: 'Cart fetched successfully',
            cart: {
                ...cart,
                items: itemsWithDetails,
                crossSellProducts: allCrossSellProducts,
                isPrescriptionRequired,
                medicines: undefined // remove medicines array from response
            }
        });

    } catch (err: any) {
        console.error("Cart fetch error:", err);

        return NextResponse.json(
            { success: false, error: "Internal server error", details: err.message },
            { status: 500 }
        );
    }
}