import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';

import Cart from '@/models/Cart';
import GuestCart from '@/models/GuestCart';
import Medicine from '@/models/Medicine';
import Setting from '@/models/Setting';
import mongoose from 'mongoose';

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

function getActiveSurge(surgePricing: any[]) {
    const now = new Date();

    // Convert to IST explicitly
    const istTime = new Date(
        now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    );

    const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    const currentDay = days[istTime.getDay()];

    const hours = istTime.getHours().toString().padStart(2, "0");
    const minutes = istTime.getMinutes().toString().padStart(2, "0");
    const currentTime = `${hours}:${minutes}`;

    console.log("IST Day:", currentDay);
    console.log("IST Time:", currentTime);

    const activeSurge = surgePricing.find((item) => {
        return (
            item.day === currentDay &&
            item.status === true &&
            currentTime >= item.startTime &&
            currentTime <= item.endTime
        );
    });

    return activeSurge || null;
}

/**
 * @swagger
 * /api/customer/order/cart-calculation:
 *   post:
 *     summary: Calculate cart/order totals for customer
 *     description: Returns calculation data for user's cart including medicine IDs, quantities, totals, fees, and commissions.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User's ObjectId (required for logged-in users)
 *               guestId:
 *                 type: string
 *                 description: Guest user's unique ID (required for guest users)
 *               storeId:
 *                 type: string
 *                 description: Store's ObjectId (required)
 *               discount:
 *                 type: number
 *                 description: Discount amount to apply (optional)
 *     responses:
 *       200:
 *         description: Calculation data returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     priceTotalSumBeforeDiscount:
 *                       type: number
 *                     priceTotalSumAfterDiscount:
 *                       type: number
 *                     mrpTotalSum:
 *                       type: number
 *                     platformFee:
 *                       type: number
 *                     razorPayCommissionAmount:
 *                       type: number
 *                     razorPayCommissionGstAmount:
 *                       type: number
 *                     totalOrderAmount:
 *                       type: number
 *                     medicineId:
 *                       type: array
 *                       items:
 *                         type: string
 *                     medicineQuantity:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           medicineId:
 *                             type: string
 *                           quantity:
 *                             type: number
 */

export async function POST(req: NextRequest) {
    await dbConnect();
    const { userId, guestId, storeId, discount } = await req.json();
    if (((!userId || typeof userId !== 'string') && (!guestId || typeof guestId !== 'string')) || !storeId || typeof storeId !== 'string') {
        return NextResponse.json({ success: false, message: 'userId or guestId and storeId are required' }, { status: 400 });
    }
    const discountValue: any = typeof discount === 'number' && discount > 0 ? Number(discount.toFixed(2)) : 0;

    let cartData;
    if (guestId) {

        // Guest user cart calculation
        cartData = await GuestCart.aggregate([
            { $match: { guestId: guestId, storeId: new mongoose.Types.ObjectId(storeId) } },
            { $unwind: '$items' },
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
                    guestId: '$guestId',
                    medicine: 1,
                    quantity: '$items.quantity',
                }
            }
        ]);

    } else {

        // Logged-in user cart calculation
        cartData = await Cart.aggregate([
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

    }

    if (!cartData || cartData.length === 0) {
        return NextResponse.json({ success: true, message: 'Cart data not found' });
    }

    // Get settings
    const settings = await Setting.find().lean();
    const calculationData: any = {};
    const medicineId: any[] = [];
    const medicineQuantity: any[] = [];
    let deliveryFee = 0;
    let deliveryFeeThreshold: any = "";
    let surgePricing: any = [];

    for (const setting of settings) {
        if (setting.type === 'gst') calculationData.gstInPercent = Number(setting.data);
        if (setting.type === 'platform fee') calculationData.platformFeeInRupees = Number(setting.data);
        if (setting.type === 'platform fee gst') calculationData.platformFeeGstInPercent = Number(setting.data);
        if (setting.type === 'razorPay comission') calculationData.razorPayCommissionInPercent = Number(setting.data);
        if (setting.type === 'razorPay gst') calculationData.razorPayCommissionGstInPercent = Number(setting.data);
        if (setting.type === 'deliveryFee') deliveryFee = Number(setting.data);
        if (setting.type === 'deliveryFeeThreshold') deliveryFeeThreshold = setting.data;
        if (setting.type === 'surgePricing') surgePricing = setting?.extraData || [];
    }

    calculationData.showDeliveryFee = deliveryFee

    const surge = getActiveSurge(surgePricing);

    //     Surge Active: {
    //   day: 'TUE',
    //   startTime: '10:00',
    //   endTime: '22:00',
    //   surgeFee: 60,
    //   status: true
    // }

    if (surge) {
        console.log("Surge Active:", surge);
        deliveryFee = Number(deliveryFee) + Number(surge.surgeFee);
    } else {
        console.log("No Surge Now");
    }

    // console.log("$$$$$$$$$cartData$$$$$$$$$",cartData);

    const priceTotalSumBeforeDiscount = cartData.reduce((sum, item) => sum + (item.medicine.price * item.quantity), 0);

    for (const element of cartData) {
        medicineId.push(new mongoose.Types.ObjectId(element.medicine._id));

        let couponDiscountAmount = 0;

        if (discountValue > 0) {

            couponDiscountAmount = (Number(element.medicine.price) / Number(priceTotalSumBeforeDiscount)) * discountValue;

        }

        medicineQuantity.push({
            medicineId: `${element.medicine._id}`,
            name: element.medicine.name,
            manufacturer: element.medicine.manufacturer,
            coverImage: element.medicine.coverImage,
            images: element.medicine.images,
            quantity: Number(element.quantity),
            price: Number(element.medicine.price),
            mrp: Number(element.medicine.mrp),
            discount: Number(element.medicine.discount),
            couponDiscount: Number(couponDiscountAmount).toFixed(2),
            isPrescription: element.medicine.isPrescription,
            status: 'pending'
        });
    }

    const mrpTotalSum = cartData.reduce((sum, item) => sum + (item.medicine.mrp * item.quantity), 0);
    const platformFee = Number(calculationData.platformFeeInRupees) + (Number(calculationData.platformFeeInRupees) * Number(calculationData.platformFeeGstInPercent)) / 100;
    calculationData.priceTotalSumBeforeDiscount = Number(priceTotalSumBeforeDiscount.toFixed(2));
    calculationData.mrpTotalSum = Number(mrpTotalSum.toFixed(2));
    calculationData.platformFee = Number(platformFee.toFixed(2));
    calculationData.discount = Number(discountValue.toFixed(2));
    // Apply discount to priceTotalSum
    const priceTotalSumAfterDiscount = Math.max(0, priceTotalSumBeforeDiscount - discountValue);
    calculationData.priceTotalSumAfterDiscount = Number(priceTotalSumAfterDiscount.toFixed(2));
    calculationData.deliveryFee = deliveryFeeThreshold == "" ? deliveryFee : calculateDeliveryFee(
        priceTotalSumAfterDiscount,
        Number(deliveryFeeThreshold),
        deliveryFee
    );
    const userTotalCharged = priceTotalSumAfterDiscount + platformFee;
    const razorPayCommissionAmount = (userTotalCharged * Number(calculationData.razorPayCommissionInPercent)) / 100;
    const razorPayCommissionGstAmount = (razorPayCommissionAmount * Number(calculationData.razorPayCommissionGstInPercent)) / 100;
    calculationData.razorPayCommissionAmount = Number(razorPayCommissionAmount.toFixed(2));
    calculationData.razorPayCommissionGstAmount = Number(razorPayCommissionGstAmount.toFixed(2));
    let totalOrderAmount = userTotalCharged + razorPayCommissionAmount + razorPayCommissionGstAmount + calculationData.deliveryFee;

    calculationData.totalOrderAmount = Number(totalOrderAmount.toFixed(2));
    calculationData.medicineId = medicineId;
    calculationData.medicineQuantity = medicineQuantity;

    if (calculationData.deliveryFee > 0) {

        if (surge) {
            calculationData.showSurgeFee = Number(surge.surgeFee)
            calculationData.activeSurgeDetail = surge
        } else {
            calculationData.showSurgeFee = 0
            calculationData.activeSurgeDetail = null
        }

    } else {
        calculationData.showDeliveryFee = 0
        calculationData.showSurgeFee = 0
        calculationData.activeSurgeDetail = null

    }

    return NextResponse.json({
        success: true,
        message: 'Get calculation data successfully',
        data: calculationData
    });
}
