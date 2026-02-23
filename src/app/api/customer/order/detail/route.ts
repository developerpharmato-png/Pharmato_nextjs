import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import '@/models/Medicine';   // 🚨 MUST
import Order from '@/models/Order';
import moment from 'moment-timezone';
import Store from '@/models/Store';
import Admin from '@/models/Admin';

/**
 * @swagger
 * /api/customer/order/detail:
 *   post:
 *     summary: Get detail of a specific order for a customer
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
 *               orderId:
 *                 type: string
 *                 description: Order's ObjectId
 *     responses:
 *       200:
 *         description: Order detail
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Missing or invalid input
 */

export async function POST(req: NextRequest) {
  await dbConnect();

  const { userId, orderId } = await req.json();

  if (
    !userId ||
    !orderId ||
    !mongoose.Types.ObjectId.isValid(userId) ||
    !mongoose.Types.ObjectId.isValid(orderId)
  ) {
    return NextResponse.json(
      { status: false, message: 'Invalid userId or orderId' },
      { status: 400 }
    );
  }

  const orderObjectId = new mongoose.Types.ObjectId(orderId);
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const orders = await Order.aggregate([
    // 1️⃣ Match order (findOne equivalent)
    {
      $match: {
        _id: orderObjectId,
        userId: userObjectId
      }
    },

    // 2️⃣ Lookup medicines
    {
      $lookup: {
        from: 'medicines',
        localField: 'medicineId',
        foreignField: '_id',
        as: 'medicineDetails'
      }
    },

    // 3️⃣ Merge medicineQuantity into medicineDetails
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

                  // ✅ ACTUAL VALUES (fallback only if not present)
                  quantity: { $ifNull: ['$$mq.quantity', 1] },
                  price: { $ifNull: ['$$mq.price', '$$med.price'] },
                  isPrescription: { $ifNull: ['$$mq.isPrescription', '$$med.isPrescription'] },
                  status: { $ifNull: ['$$mq.status', 'pending'] },
                  cancelReason: { $ifNull: ['$$mq.cancelReason', ''] }
                }
              }
            }
          }
        }
      }
    },

    // 4️⃣ Cleanup unwanted fields
    {
      $project: {
        medicineId: 0,
        medicineQuantity: 0
      }
    }
  ]);


  if (!orders.length) {
    return NextResponse.json(
      { status: false, message: 'Order not found' },
      { status: 404 }
    );
  }

  // Format createdAt and deliveredDate if present using moment
  const orderData = { ...orders[0] };

  if (orderData.createdAt) {
    orderData.createdAt = moment(orderData.createdAt)
      .tz('Asia/Kolkata')
      .format('MMM D, YYYY HH:mm z');
  }
  if (orderData.deliveredDate) {
    orderData.deliveredDate = moment(orderData.deliveredDate)
      .tz('Asia/Kolkata')
      .format('MMM D, YYYY HH:mm z');
  } else {
    orderData.deliveredDate = "";
  }
  // Format expectedDeliveryDate with Asia/Kolkata timezone
  if (orderData.expectedDeliveryDate) {
    orderData.expectedDeliveryDate = moment(orderData.expectedDeliveryDate)
      .tz('Asia/Kolkata')
      .format('MMM D, YYYY');
  } else {
    orderData.expectedDeliveryDate = "";
  }

  // Fetch store details
  let storeDetails : any = null;
  if (orderData.storeId) {
    storeDetails = await Store.findById(orderData.storeId).lean();
    if (storeDetails && storeDetails.adminManagerId) {
      const admin : any = await Admin.findById(storeDetails.adminManagerId).lean();
      if (admin) {
        storeDetails.name = admin.name || '';
        storeDetails.email = admin.email || '';
        storeDetails.mobile = admin.mobile || '';
      }
    }
  }

  orderData.storeDetails = storeDetails;

  return NextResponse.json({ status: true, data: { ...orderData } });
}


