import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Order from '@/models/Order';
import UserAddress from '@/models/UserAddress';
import Store from '@/models/Store';
import Medicine from '@/models/Medicine';
import mongoose from 'mongoose';
import Wallet from '@/models/Wallet';
import { getDb } from '@/utils/firebase.helper';
import Cart from '@/models/Cart';
import Setting from '@/models/Setting';

function calculateDeliveryFee(
    orderAmount: number,
    deliveryFeeThreshold: number,
    deliveryFee: number
): number {
    if (orderAmount >= deliveryFeeThreshold) {
        return 0;
    }
    return deliveryFee;
}

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
 *             required:
 *               - userId
 *               - storeId
 *               - calculationData
 *               - addressId
 *               - isPaymentByWallet
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
 *               isPaymentByWallet:
 *                 type: boolean
 *                 description: Whether payment is by wallet
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
    const { userId, storeId, calculationData, addressId, isPrescriptionRequired, prescription_url, isPaymentByWallet } = await req.json();

    if (typeof isPaymentByWallet !== 'boolean') {
        return NextResponse.json({ success: false, message: 'isPaymentByWallet is required and must be boolean' }, { status: 400 });
    }

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

    // Get settings
    const settings = await Setting.find().lean();
    let deliveryFee = 0;
    let deliveryFeeThreshold: any = "";

    for (const setting of settings) {
        if (setting.type === 'deliveryFee') deliveryFee = Number(setting.data);
        if (setting.type === 'deliveryFeeThreshold') deliveryFeeThreshold = setting.data;
    }

    if (deliveryFeeThreshold !== "") {

        deliveryFee = calculateDeliveryFee(
            calculationData.priceTotalSumAfterDiscount,
            deliveryFeeThreshold,
            deliveryFee
        );

    }

    // Validate delivery fee
    if (deliveryFee !== Number(calculationData.deliveryFee)) {

        return NextResponse.json({ success: false, message: 'Delivery fee changed' }, { status: 400 });

    }

    // Fetch address and log it
    const addressDoc = await UserAddress.findById(addressId);
    if (!addressDoc) {
        return NextResponse.json({ success: false, message: 'Address not found' }, { status: 404 });
    }
    // console.log('Order address:', addressDoc);
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
    const paymentId = isPaymentByWallet ? `PAYID-WALLET-PMT-${uniqueNumber}M` : `PAYID-PMT-${uniqueNumber}M`;
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

    const cart = await Cart.findOne({ userId, storeId })

    if (cart?.items?.length > 0) {

        const calculationItems = calculationData.medicineQuantity;
        const cartItems = cart.items;

        // Loop over calculation medicines
        for (const calcItem of calculationItems) {

            const cartItem = cartItems.find(
                (item: any) => item.medicineId.toString() === calcItem.medicineId.toString()
            );

            // Agar cart me medicine hi nahi mili
            if (!cartItem) {
                return NextResponse.json({ success: false, message: 'Cart item changed' }, { status: 400 });
            }

            // Agar quantity mismatch hai
            if (cartItem.quantity !== calcItem.quantity) {
                return NextResponse.json({ success: false, message: 'Cart item changed' }, { status: 400 });
            }
        }

        // Loop over cart items
        for (const cartItem of cartItems) {

            const calcItem = calculationItems.find(
                (item: any) => item.medicineId.toString() === cartItem.medicineId.toString()
            );

            // Agar calculationData me medicine hi nahi mili
            if (!calcItem) {
                return NextResponse.json(
                    { success: false, message: 'Cart item changed' },
                    { status: 400 }
                );
            }

            // Agar quantity mismatch hai
            if (cartItem.quantity !== calcItem.quantity) {
                return NextResponse.json(
                    { success: false, message: 'Cart item changed' },
                    { status: 400 }
                );
            }
        }

    } else {
        return NextResponse.json({ success: false, message: 'Cart empty' }, { status: 400 });
    }

    // Logged-in user cart calculation
    const cartData = await Cart.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId), storeId: new mongoose.Types.ObjectId(storeId) } },
        { $unwind: '$items' },
        {
            $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: '_id',
                as: 'user'
            }
        },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        {
            $lookup: {
                from: 'medicines',
                localField: 'items.medicineId',
                foreignField: '_id',
                as: 'medicine'
            }
        },
        { $unwind: { path: '$medicine', preserveNullAndEmptyArrays: true } },
        {
            $project: {
                _id: 1,
                userId: '$user._id',
                medicine: 1,
                quantity: '$items.quantity',
            }
        }
    ]);

    const priceTotalSumBeforeDiscount = cartData.reduce((sum, item) => sum + (item.medicine.price * item.quantity), 0);

    if (Number(priceTotalSumBeforeDiscount.toFixed(2)) !== Number(calculationData?.priceTotalSumBeforeDiscount || 0)) {

        return NextResponse.json(
            { success: false, message: 'Item price changed' },
            { status: 400 }
        );

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
        payment_mode: isPaymentByWallet ? 'Wallet' : 'online',
        total_order_amount: totalOrderAmount,
        actual_amount: calculationData.priceTotalSumBeforeDiscount || 0,
        user_total_tax_charged: userTotalTaxCharged,
        razorPay_total_tax_charged: totalAmountRazorPayCharged,
        platform_fee: calculationData.platformFee || 0,
        discount: discount,
        order_id: orderID,
        invoice_url: '',
        payment_id: paymentId,
        payment_status: isPaymentByWallet ? 'Deducted From Wallet' : 'Pending',
        is_order_rated: 0,
        order_status: isPaymentByWallet ? 'Order Placed' : 'Pending',
        medicineQuantity: calculationData.medicineQuantity || [],
        calculationData,
        paymentHistory: [{}],
        isPrescriptionRequired: isPrescriptionRequired || false,
        prescription_url: prescriptionUrlArr,
        prescription_status: isPrescriptionRequired ? 'Pending' : 'Not Required',
        deliveredAddress: addressDoc.toObject(),
        expectedDeliveryDate,
    });

    if (isPaymentByWallet) {

        const userObjectId =
            typeof createOrder.userId === 'string'
                ? new mongoose.Types.ObjectId(createOrder.userId)
                : createOrder.userId;

        const walletDoc = await Wallet.create({
            userId: userCheck._id,
            payment_mode: 'Wallet',
            amount: totalOrderAmount || 0,
            totalAmount: totalOrderAmount || 0,
            razorPay_total_tax_charged: totalAmountRazorPayCharged || 0,
            recharge_id: '',
            payment_id: '',
            recharge_status: 'Success',
            payment_status: 'Credited',
            wallet_transaction_type: 'Paid to',
            transaction_to: `Pharmato`,
            paymentHistory: [],
        });

        await User.updateOne(
            { _id: userObjectId },
            { $inc: { walletAmount: -Number(totalOrderAmount || 0) } }
        );

        // Update paymentStatus in Firebase Realtime Database
        if (createOrder?.order_id) {
            const db = getDb();
            //Firebase realtime data update
            const firebaseRef = db.ref(`orders/${createOrder.order_id}`);
            const snapshot = await firebaseRef.once('value');
            const isOrderStatusChanged: any = Number(snapshot.val()?.isOrderStatusChanged || 0) + 1
            await firebaseRef.update({
                isOrderStatusChanged: isOrderStatusChanged,
                paymentStatus: createOrder.payment_status
            });
        }

    }

    if (createOrder) {
        return NextResponse.json({
            success: true,
            message: 'Ordered successfully',
            data: {
                order_id_fk: createOrder.id,
                orderID: createOrder.order_id,
                isPaymentTake: isPaymentByWallet ? false : true,
                razorPayKeyId: process.env.razorPay_Key_Id || '',
                razorPaySecretKey: process.env.razorPay_Secret_Key || ''
            }
        });
    } else {
        return NextResponse.json({ success: false, message: 'Order not created' });
    }

}
