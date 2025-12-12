import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Cart from '@/models/Cart';
import Medicine from '@/models/Medicine';
import Setting from '@/models/Setting';
import mongoose from 'mongoose';

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
 *                 description: User's ObjectId
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
    const { userId, discount } = await req.json();
    if (!userId || typeof userId !== 'string') {
        return NextResponse.json({ success: false, message: 'userId is required' }, { status: 400 });
    }
    const discountValue = typeof discount === 'number' && discount > 0 ? discount : 0;
    // Aggregate cart data for user
    const cartData = await Cart.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
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

    if (!cartData || cartData.length === 0) {
        return NextResponse.json({ success: true, message: 'Cart data not found' });
    }

    // Get settings
    const settings = await Setting.find().lean();
    const calculationData: any = {};
    const medicineId: any[] = [];
    const medicineQuantity: any[] = [];

    for (const setting of settings) {
        if (setting.type === 'gst') calculationData.gstInPercent = Number(setting.data);
        if (setting.type === 'platform fee') calculationData.platformFeeInRupees = Number(setting.data);
        if (setting.type === 'platform fee gst') calculationData.platformFeeGstInPercent = Number(setting.data);
        if (setting.type === 'razorPay comission') calculationData.razorPayCommissionInPercent = Number(setting.data);
        if (setting.type === 'razorPay gst') calculationData.razorPayCommissionGstInPercent = Number(setting.data);
    }

    for (const element of cartData) {
        medicineId.push(new mongoose.Types.ObjectId(element.medicine._id));
        medicineQuantity.push({ medicineId: `${element.medicine._id}`, quantity: Number(element.quantity) });
    }

    const priceTotalSumBeforeDiscount = cartData.reduce((sum, item) => sum + (item.medicine.price * item.quantity), 0);
    const mrpTotalSum = cartData.reduce((sum, item) => sum + (item.medicine.mrp * item.quantity), 0);
    const platformFee = Number(calculationData.platformFeeInRupees) + (Number(calculationData.platformFeeInRupees) * Number(calculationData.platformFeeGstInPercent)) / 100;
    calculationData.priceTotalSumBeforeDiscount = priceTotalSumBeforeDiscount;
    calculationData.mrpTotalSum = mrpTotalSum;
    calculationData.platformFee = platformFee;
    calculationData.discount = discountValue;
    // Apply discount to priceTotalSum
    const priceTotalSumAfterDiscount = Math.max(0, priceTotalSumBeforeDiscount - discountValue);
    calculationData.priceTotalSumAfterDiscount = priceTotalSumAfterDiscount;
    const userTotalCharged = priceTotalSumAfterDiscount + platformFee;
    const razorPayCommissionAmount = (userTotalCharged * Number(calculationData.razorPayCommissionInPercent)) / 100;
    const razorPayCommissionGstAmount = (razorPayCommissionAmount * Number(calculationData.razorPayCommissionGstInPercent)) / 100;
    calculationData.razorPayCommissionAmount = razorPayCommissionAmount;
    calculationData.razorPayCommissionGstAmount = razorPayCommissionGstAmount;
    let totalOrderAmount = userTotalCharged + razorPayCommissionAmount + razorPayCommissionGstAmount;
    calculationData.totalOrderAmount = totalOrderAmount;
    calculationData.medicineId = medicineId;
    calculationData.medicineQuantity = medicineQuantity;

    return NextResponse.json({
        success: true,
        message: 'Get calculation data successfully',
        data: calculationData
    });
}
