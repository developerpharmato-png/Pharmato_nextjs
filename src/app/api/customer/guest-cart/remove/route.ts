import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import GuestCart from '@/models/GuestCart';

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
    await connectDB();
    const body = await request.json();
    const { guestId, medicineId } = body;
    if (!guestId) {
        return NextResponse.json({ success: false, error: 'Guest not authenticated' }, { status: 401 });
    }
    if (!medicineId || typeof medicineId !== 'string') {
        return NextResponse.json({ success: false, error: 'medicineId is required and must be a string' }, { status: 400 });
    }
    const cartDoc = await GuestCart.findOne({ guestId });
    if (!cartDoc) {
        return NextResponse.json({ success: false, error: 'Guest cart not found' }, { status: 404 });
    }
    cartDoc.items = cartDoc.items.filter((item: any) => item.medicineId.toString() !== medicineId);
    await cartDoc.save();

    // AGGREGATE PIPELINE (FULL GUEST CART WITH MEDICINE DETAILS, SELECTED FIELDS)
    const fullCart = await GuestCart.aggregate([
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
        },
        {
            $addFields: {
                items: {
                    $map: {
                        input: "$items",
                        as: "item",
                        in: {
                            quantity: "$$item.quantity",
                            _id: "$$item._id",
                            medicineId: {
                                $let: {
                                    vars: {
                                        med: {
                                            $arrayElemAt: [
                                                {
                                                    $filter: {
                                                        input: "$medicines",
                                                        as: "m",
                                                        cond: { $eq: ["$$m._id", "$$item.medicineId"] }
                                                    }
                                                },
                                                0
                                            ]
                                        }
                                    },
                                    in: {
                                        _id: "$$med._id",
                                        name: "$$med.name",
                                        categoryId: "$$med.categoryId",
                                        subCategoryId: "$$med.subCategoryId",
                                        manufacturer: "$$med.manufacturer",
                                        isPrescription: "$$med.isPrescription",
                                        price: "$$med.price",
                                        mrp: "$$med.mrp",
                                        discount: "$$med.discount",
                                        images: "$$med.images",
                                        coverImage: "$$med.coverImage"
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        {
            $project: {
                medicines: 0
            }
        }
    ]);
    return NextResponse.json({ success: true, cart: fullCart?.[0] || null, message: 'Removed from Cart' });
}
