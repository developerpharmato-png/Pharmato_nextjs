import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import GuestCart from '@/models/GuestCart';
import mongoose from 'mongoose';

/**
 * @swagger
 * /api/customer/guest-cart/get:
 *   post:
 *     summary: Get guest cart
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
 *                 example: "GUEST_ID"
 *     responses:
 *       200:
 *         description: Guest cart fetched
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
    await connectDB();
    let body: any = {};
    try {
        body = await request.json();
    } catch (err) {
        // If no body or invalid JSON, ignore
    }
    const guestId = body.guestId;
    if (!guestId) {
        return NextResponse.json({ success: false, error: 'Guest not authenticated' }, { status: 401 });
    }

    // AGGREGATE PIPELINE (FULL GUEST CART WITH MEDICINE DETAILS, SELECTED FIELDS)
    const cartAgg = await GuestCart.aggregate([
        {
            $match: {
                guestId: guestId
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
            '_id name manufacturer mrp price images discount').lean();
        allCrossSellProducts = crossSellMeds.map((prod: any) => {
            const inCart = cartQuantityMap[prod._id.toString()] || 0;
            return {
                ...prod,
                isInCart: inCart > 0,
                cartQuantity: inCart
            };
        }).filter((prod: any) => !prod.isInCart);
    }

    // Items with medicine details
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
                images: med.images,
                coverImage: med.coverImage
            } : item.medicineId
        };
    }));

    return NextResponse.json({
        success: true,
        message: 'Cart fetched successfully',
        cart: {
            ...cart,
            items: itemsWithDetails,
            crossSellProducts: allCrossSellProducts,
            medicines: undefined // remove medicines array from response
        }
    });
}
