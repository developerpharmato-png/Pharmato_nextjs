import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import mongoose from 'mongoose';
import moment from 'moment-timezone';

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

        // 2️⃣ Latest orders first
        {
            $sort: { createdAt: -1 }
        },

        // 3️⃣ Lookup medicines
        {
            $lookup: {
                from: 'medicines',
                localField: 'medicineId',
                foreignField: '_id',
                as: 'medicineDetails'
            }
        },

        // 4️⃣ Attach quantity properly (ObjectId vs String FIX)
        {
            $addFields: {
                medicineDetails: {
                    $map: {
                        input: '$medicineDetails',
                        as: 'med',
                        in: {
                            $let: {
                                vars: {
                                    mq: {
                                        $arrayElemAt: [
                                            {
                                                $filter: {
                                                    input: '$medicineQuantity',
                                                    as: 'item',
                                                    cond: {
                                                        $eq: [
                                                            { $toString: '$$item.medicineId' },
                                                            { $toString: '$$med._id' }
                                                        ]
                                                    }
                                                }
                                            },
                                            0
                                        ]
                                    }
                                },
                                in: {
                                    _id: '$$med._id',
                                    name: '$$med.name',
                                    manufacturer: '$$med.manufacturer',
                                    mrp: '$$med.mrp',
                                    // price: '$$med.price',
                                    discount: '$$med.discount',
                                    images: '$$med.images',
                                    coverImage: '$$med.coverImage',

                                    // ✅ Correct quantity
                                    quantity: { $ifNull: ['$$mq.quantity', 1] },
                                    price: { $ifNull: ['$$mq.price', '$$med.price'] },
                                    status: { $ifNull: ['$$mq.status', 'pending'] },
                                    cancelReason: { $ifNull: ['$$mq.cancelReason', ''] }
                                }
                            }
                        }
                    }
                }
            }
        }

        // ❌ medicineId intentionally kept
        // frontend ke kaam aa sakta hai
    ]);





    // Format createdAt, deliveredDate, and expectedDeliveryDate for each order with Asia/Kolkata timezone
    const formattedOrders = orders.map(order => ({
        ...order,
        createdAt: order.createdAt ? moment(order.createdAt).tz('Asia/Kolkata').format('MMM D, YYYY HH:mm z') : order.createdAt,
        deliveredDate: order.deliveredDate ? moment(order.deliveredDate).tz('Asia/Kolkata').format('MMM D, YYYY HH:mm z') : "",
        expectedDeliveryDate: order.expectedDeliveryDate ? moment(order.expectedDeliveryDate).tz('Asia/Kolkata').format('MMM D, YYYY') : ""
    }));
    return NextResponse.json({ status: true, data: formattedOrders });
}

