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
    const cart = await GuestCart.aggregate([
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
                                        manufacturer: "$$med.manufacturer",
                                        isPrescription: "$$med.isPrescription",
                                        price: "$$med.price",
                                        mrp: "$$med.mrp",
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

    return NextResponse.json({
        success: true,
        cart: cart?.[0] || null
    });
}
