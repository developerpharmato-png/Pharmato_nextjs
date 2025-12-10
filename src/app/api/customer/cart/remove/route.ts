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

    // AGGREGATE PIPELINE (FULL CART WITH MEDICINE DETAILS, SELECTED FIELDS)
    const fullCart = await Cart.aggregate([
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
