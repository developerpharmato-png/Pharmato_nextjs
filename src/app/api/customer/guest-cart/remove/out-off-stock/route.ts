import { NextRequest, NextResponse } from 'next/server';
import GuestCart from '@/models/GuestCart';
import mongoose from 'mongoose';
import { updateGuestCartCountInFirebase } from '@/utils/updateGuestCartCountInFirebase';
import connectDB from '@/lib/mongodb';
await connectDB();

/**
 * @swagger
 * /api/customer/guest-cart/remove/out-off-stock:
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
    const { guestId, storeId } = body;
    if (!guestId) {
        return NextResponse.json({ success: false, error: 'Guest not authenticated' }, { status: 401 });
    }
    if (!storeId || typeof storeId !== 'string') {
        return NextResponse.json({ success: false, error: 'storeId is required and must be a string' }, { status: 400 });
    }
    const cartDoc = await GuestCart.findOne({ guestId, storeId });
    if (!cartDoc) {
        return NextResponse.json({ success: false, error: 'Guest cart not found' }, { status: 404 });
    }
    // Get all medicineIds in the cart
    const medicineIds = cartDoc.items.map((item: any) => item.medicineId);
    // Find out-of-stock medicineIds
    const Medicine = (await import('@/models/Medicine')).default;
    const outOfStockMeds = await Medicine.find({ _id: { $in: medicineIds }, stock: { $lte: 0 } }).select('_id');
    const outOfStockIds = new Set(outOfStockMeds.map((m: any) => m._id.toString()));
    // Remove all out-of-stock items from cart
    cartDoc.items = cartDoc.items.filter((item: any) => !outOfStockIds.has(item.medicineId.toString()));
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
