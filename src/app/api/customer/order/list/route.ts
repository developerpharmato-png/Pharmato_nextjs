import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import mongoose from 'mongoose';

/**
 * @swagger
 * /api/customer/order/list:
 *   post:
 *     summary: Get list of orders for a customer
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
 *     responses:
 *       200:
 *         description: List of orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Missing or invalid input
 */

export async function POST(req: NextRequest) {
    await dbConnect();

    const { userId } = await req.json();

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return NextResponse.json(
            { status: false, message: 'Invalid userId' },
            { status: 400 }
        );
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const orders = await Order.aggregate([
        // 1️⃣ Match user
        {
            $match: {
                userId: userObjectId
            }
        },

        // 2️⃣ Sort latest first
        {
            $sort: { createdAt: -1 }
        },

        // 3️⃣ Lookup medicines
        {
            $lookup: {
                from: 'medicines', // 🔥 collection name (plural, lowercase)
                localField: 'medicineId',
                foreignField: '_id',
                as: 'medicineDetails'
            }
        },

        // 4️⃣ Attach quantity to each medicine
        {
            $addFields: {
                medicineDetails: {
                    $map: {
                        input: '$medicineDetails',
                        as: 'med',
                        in: {
                            _id: '$$med._id',
                            name: '$$med.name',
                            manufacturer: '$$med.manufacturer',
                            mrp: '$$med.mrp',
                            price: '$$med.price',
                            discount: '$$med.discount',
                            images: '$$med.images',
                            coverImage: '$$med.coverImage',
                            quantity: {
                                $let: {
                                    vars: {
                                        q: {
                                            $arrayElemAt: [
                                                {
                                                    $filter: {
                                                        input: '$medicineQuantity',
                                                        as: 'mq',
                                                        cond: {
                                                            $eq: ['$$mq.medicineId', '$$med._id']
                                                        }
                                                    }
                                                },
                                                0
                                            ]
                                        }
                                    },
                                    in: { $ifNull: ['$$q.quantity', 1] }
                                }
                            }
                        }
                    }
                }
            }
        }

        // ❌ medicineId remove nahi kar raha
        // frontend ke kaam aa sakta hai
    ]);

    return NextResponse.json({ status: true, data: orders });
}

