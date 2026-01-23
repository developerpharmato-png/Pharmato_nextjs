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
 * /api/customer/guest-cart/remove:
 *   post:
 *     summary: Remove one item from guest cart
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
 *               storeId:
 *                 type: string
 *                 example: "STORE_ID"
 *               medicineId:
 *                 type: string
 *                 example: "MEDICINE_ID"
 *     responses:
 *       200:
 *         description: Item removed from guest cart
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
    const body = await request.json();
    const { guestId, storeId, medicineId } = body;
    if (!guestId) {
        return NextResponse.json({ success: false, error: 'Guest not authenticated' }, { status: 401 });
    }
    if (!storeId || typeof storeId !== 'string') {
        return NextResponse.json({ success: false, error: 'storeId is required and must be a string' }, { status: 400 });
    }
    if (!medicineId || typeof medicineId !== 'string') {
        return NextResponse.json({ success: false, error: 'medicineId is required and must be a string' }, { status: 400 });
    }
    const cartDoc = await GuestCart.findOne({ guestId, storeId });
    if (!cartDoc) {
        return NextResponse.json({ success: false, error: 'Guest cart not found' }, { status: 404 });
    }
    cartDoc.items = cartDoc.items.filter((item: any) => item.medicineId.toString() !== medicineId);
    await cartDoc.save();

    
    // Update cart count in Firebase
    updateGuestCartCountInFirebase({ guestId, storeId }); // fire-and-forget, don't await

    // AGGREGATE PIPELINE (FULL GUEST CART WITH MEDICINE DETAILS, SELECTED FIELDS)
    const cartAgg = await GuestCart.aggregate([
        {
            $match: {
                _id: cartDoc._id,
                storeId: new mongoose.Types.ObjectId(storeId)
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
