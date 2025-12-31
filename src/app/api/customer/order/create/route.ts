import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Order from '@/models/Order';
import UserAddress from '@/models/UserAddress';
import Store from '@/models/Store';
import Medicine from '@/models/Medicine';
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
 *               storeId:
 *                 type: string
 *                 description: Store's ObjectId for the order
 *               calculationData:
 *                 type: object
 *                 description: Calculation data from cart-calculation API
 *               addressId:
 *                 type: string
 *                 description: User address ObjectId to be used for this order
 *               isPrescriptionRequired:
 *                 type: boolean
 *                 description: Whether a prescription is required for this order
 *               prescription_url:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of prescription image/pdf URLs
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
    const { userId, storeId, calculationData, addressId, isPrescriptionRequired, prescription_url } = await req.json();

    // Normalize prescription_url to array of strings
    let prescriptionUrlArr: string[] = [];
    if (Array.isArray(prescription_url)) {
        prescriptionUrlArr = prescription_url.filter(url => typeof url === 'string');
    } else if (typeof prescription_url === 'string' && prescription_url) {
        prescriptionUrlArr = [prescription_url];
    }
    if (!userId || typeof userId !== 'string') {
        return NextResponse.json({ success: false, message: 'userId is required' }, { status: 400 });
    }
    if (!storeId || typeof storeId !== 'string' || storeId.trim() === '') {
        return NextResponse.json({ success: false, message: 'storeId is required' }, { status: 400 });
    }
    if (!calculationData || typeof calculationData !== 'object') {
        return NextResponse.json({ success: false, message: 'calculationData is required' }, { status: 400 });
    }
    if (!addressId || typeof addressId !== 'string') {
        return NextResponse.json({ success: false, message: 'addressId is required' }, { status: 400 });
    }
    if (!mongoose.Types.ObjectId.isValid(addressId)) {
        return NextResponse.json({ success: false, message: 'Invalid addressId' }, { status: 400 });
    }
    const userCheck = await User.findOne({ _id: new mongoose.Types.ObjectId(userId) });
    if (!userCheck) {
        return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }
    // Fetch address and log it
    const addressDoc = await UserAddress.findById(addressId);
    if (!addressDoc) {
        return NextResponse.json({ success: false, message: 'Address not found' }, { status: 404 });
    }
    console.log('Order address:', addressDoc);
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
    let storeObjectId: mongoose.Types.ObjectId | null = null;
    try {
        storeObjectId = new mongoose.Types.ObjectId(storeId.trim());
    } catch {
        return NextResponse.json({ success: false, message: 'Invalid storeId' }, { status: 400 });
    }

    // Check if pinCode is available for the store
    // Type assertion to IStore to ensure correct property access
    const store = await Store.findOne({
        _id: storeObjectId,
        status: true
    }).lean() as import('@/models/Store').IStore | null;

    // console.log(store);

    if (!store || !Array.isArray(store.servicePinCodes) || !store.servicePinCodes.includes(addressDoc.address.pinCode)) {
        return NextResponse.json({ success: false, message: 'Pin code not serviceable by this store' }, { status: 400 });
    }

    // Calculate expectedDeliveryDate (only date, no time)
    let expectedDeliveryDate = new Date(now);
    if (now.getHours() >= 22) {
        expectedDeliveryDate.setDate(now.getDate() + 1);
    }
    expectedDeliveryDate.setHours(0, 0, 0, 0); // Set to midnight, so only date part is used

    // Check stock for each medicine in medicineQuantity
    if (Array.isArray(calculationData.medicineQuantity)) {
        for (const item of calculationData.medicineQuantity) {
            if (!item.medicineId || typeof item.quantity !== 'number') continue;
            const med = await Medicine.findById(item.medicineId).lean();
            // Type assertion to ensure med is not an array
            const medDoc = med as import('@/models/Medicine').IMedicine | null;
            if (!medDoc) {
                return NextResponse.json({ success: false, message: `Medicine not found: ${item.medicineId}` }, { status: 400 });
            }
            if (typeof medDoc.stock === 'number' && item.quantity > medDoc.stock) {
                return NextResponse.json({ success: false, message: `Stock not available for medicine: ${medDoc.name}` }, { status: 400 });
            }
        }
    }

    const createOrder = await Order.create({
        userId: userCheck._id,
        storeId: storeObjectId,
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
        paymentHistory: [{}],
        isPrescriptionRequired: isPrescriptionRequired || false,
        prescription_url: prescriptionUrlArr,
        prescription_status: isPrescriptionRequired ? 'Pending' : 'Not Required',
        deliveredAddress: addressDoc.toObject(),
        expectedDeliveryDate
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
