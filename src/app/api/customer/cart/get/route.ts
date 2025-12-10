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

        // AGGREGATE PIPELINE (FULL CART WITH MEDICINE DETAILS, SELECTED FIELDS)
        const cart = await Cart.aggregate([
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
        message: 'Cart fetched successfully',
            cart: cart?.[0] || null
        });

    } catch (err: any) {
        console.error("Cart fetch error:", err);

        return NextResponse.json(
            { success: false, error: "Internal server error", details: err.message },
            { status: 500 }
        );
    }
}