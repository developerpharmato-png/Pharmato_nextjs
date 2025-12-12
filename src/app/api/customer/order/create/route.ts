import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Order from '@/models/Order';
import mongoose from 'mongoose';

/**
 * @swagger
 * /api/customer/order/create:
 *   post:
 *     summary: Create a new customer order
 *     description: Creates an order for the customer using calculation data from cart-calculation API.
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
 *               calculationData:
 *                 type: object
 *                 description: Calculation data from cart-calculation API
 *     responses:
 *       200:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     order_id_fk:
 *                       type: string
 *                     orderID:
 *                       type: string
 *                     isPaymentTake:
 *                       type: boolean
 *                     razorPayKeyId:
 *                       type: string
 *                     razorPaySecretKey:
 *                       type: string
 *       400:
 *         description: Missing or invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 message:
 *                   type: string
 */

export async function POST(req: NextRequest) {
    await dbConnect();
    const { userId, calculationData } = await req.json();
    if (!userId || typeof userId !== 'string') {
        return NextResponse.json({ success: false, message: 'userId is required' }, { status: 400 });
    }
    if (!calculationData || typeof calculationData !== 'object') {
        return NextResponse.json({ success: false, message: 'calculationData is required' }, { status: 400 });
    }
    // Check user exists
    const userCheck = await User.findOne({ _id: userId });
    if (!userCheck) {
        return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }
    // Prepare medicineId array
    const medicineId = (calculationData.medicineId || []).map((id: string) => new mongoose.Types.ObjectId(id));
    // Generate unique order and payment IDs
    const now = new Date();
    const uniqueNumber = now.getFullYear().toString() +
        (now.getMonth() + 1).toString().padStart(2, '0') +
        now.getDate().toString().padStart(2, '0') +
        now.getHours().toString().padStart(2, '0') +
        now.getMinutes().toString().padStart(2, '0') +
        now.getSeconds().toString().padStart(2, '0') +
        now.getMilliseconds().toString().padStart(3, '0');
    const orderID = `SB-ORDER-${uniqueNumber}`;
    const paymentId = `PAYID-PNT-${uniqueNumber}M`;
    const discount = calculationData.discount || 0;
    const userTotalTaxCharged = calculationData.platformFee || 0;
    const totalOrderAmount = calculationData.totalOrderAmount || 0;
    const razorPayCommissionAmount = calculationData.razorPayCommissionAmount || 0;
    const razorPayCommissionGstAmount = calculationData.razorPayCommissionGstAmount || 0;
    const totalAmountRazorPayCharged = razorPayCommissionAmount + razorPayCommissionGstAmount;
    // Create order
    const createOrder = await Order.create({
        userId: userCheck._id,
        medicineId,
        payment_mode: calculationData.payment_mode || 'online',
        total_order_amount: totalOrderAmount,
        actual_amount: calculationData.priceTotalSumBeforeDiscount || 0,
        user_total_tax_charged: userTotalTaxCharged,
        razorPay_total_tax_charged: totalAmountRazorPayCharged,
        platform_fee: calculationData.platformFee || 0,
        discount: discount,
        order_id: orderID,
        invoice_url: '',
        payment_id: paymentId,
        payment_status: 'Pending',
        is_order_rated: 0,
        order_status: 'Pending',
        medicineQuantity: calculationData.medicineQuantity || [],
        calculationData,
        paymentHistory: [{}]
    });
    if (createOrder) {
        return NextResponse.json({
            success: true,
            message: 'Ordered successfully',
            data: {
                order_id_fk: createOrder.id,
                orderID: createOrder.order_id,
                isPaymentTake: true,
                razorPayKeyId: process.env.razorPay_Key_Id || '',
                razorPaySecretKey: process.env.razorPay_Secret_Key || ''
            }
        });
    } else {
        return NextResponse.json({ success: false, message: 'Order not created' });
    }
}
