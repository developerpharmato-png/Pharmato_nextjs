import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import moment from 'moment-timezone';
// Ensure referenced models are registered for populate
import '@/models/User';
import '@/models/Medicine';

/**
 * @swagger
 * /api/admin/order/detail:
 *   post:
 *     summary: Get detail of a specific order for admin
 *     tags:
 *       - Admin Orders
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId:
 *                 type: string
 *                 description: Order's ObjectId
 *                 required: true
 *     responses:
 *       200:
 *         description: Order detail
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Missing or invalid input
 *       404:
 *         description: Order not found
 */

export async function POST(req: NextRequest) {
    await dbConnect();

    try {
        const { orderId } = await req.json();

        if (!orderId || typeof orderId !== 'string') {
            return NextResponse.json(
                { success: false, message: 'orderId is required' },
                { status: 400 }
            );
        }

        const order: any = await Order.findOne({ _id: orderId })
            .populate({
                path: 'userId',
                select: '_id name email phone mobile'
            })
            .populate({
                path: 'medicineId',
                select: '_id name manufacturer mrp price discount images coverImage'
            });

        if (!order) {
            return NextResponse.json(
                { success: false, message: 'Order not found' },
                { status: 404 }
            );
        }

        const medicineIdWithQuantity = []

        for (const element of order.medicineQuantity) {

            const checkMedicine = order.medicineId.find((obj: any) => obj._id.toString() === element.medicineId.toString());

            const object = {
                ...checkMedicine.toObject(),
                quantity: element.quantity,
                price: element.price,
                isPrescription: element.isPrescription,
                status: element.status,
                cancelReason: element.cancelReason,
            }
            medicineIdWithQuantity.push(object);
        }

        // Return order with updated medicineId array
        const orderObj = order.toObject();
        orderObj.medicineId = medicineIdWithQuantity;

        orderObj.deliveredDate = order.deliveredDate;

        if (orderObj.deliveredDate) {
            orderObj.deliveredDate = moment(orderObj.deliveredDate)
                .tz('Asia/Kolkata')
                .format('MMM D, YYYY HH:mm z');
        } else {
            orderObj.deliveredDate = "";
        }

        for (const element of orderObj?.refundHistory || []) {

            if (element?.created_at) {
                element.created_at = moment.unix(element.created_at).tz('Asia/Kolkata').format('MMM D, YYYY HH:mm z');
            }

        }

        return NextResponse.json({ success: true, data: orderObj }, { status: 200 });

    } catch (error) {
        console.error('Error fetching order detail:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to fetch order detail',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
