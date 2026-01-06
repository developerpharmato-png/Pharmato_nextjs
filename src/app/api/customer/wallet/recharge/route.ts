/**
 * @swagger
 * /api/customer/wallet/recharge:
 *   post:
 *     summary: Recharge customer wallet
 *     tags:
 *       - Wallet
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "USER_OBJECT_ID"
 *               rechargeData:
 *                 type: object
 *                 example: { "amount": 1000, "totalAmount": 1100, "totalAmountRazorPayCharged": 100 }
 *     responses:
 *       200:
 *         description: Wallet recharge transaction created
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
 *                     walletObjectId:
 *                       type: string
 *                     orderID:
 *                       type: string
 *                     isPaymentTake:
 *                       type: boolean
 *                     razorPayKeyId:
 *                       type: string
 *                     razorPaySecretKey:
 *                       type: string
 */


import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Wallet from '@/models/Wallet';
import moment from 'moment';

export async function POST(request: NextRequest) {
    
    await dbConnect();
    const body = await request.json();
    const { userId, rechargeData } = body;
    if (!userId || typeof userId !== 'string') {
        return NextResponse.json({ status: false, message: 'userId is required' }, { status: 400 });
    }
    const userCheck = await User.findOne({ _id: userId });
    if (!userCheck) {
        return NextResponse.json({ status: false, message: 'User not found' }, { status: 404 });
    }
    const uniquePart = Date.now().toString(36); // short base36
    const rechargeID = `PH-WR-${uniquePart}`;
    const paymentId = `PY-${uniquePart}`;

    const walletDoc = await Wallet.create({
        userId: userCheck._id,
        payment_mode: 'online',
        amount: rechargeData?.amount || 0,
        totalAmount: rechargeData?.totalAmount || 0,
        razorPay_total_tax_charged: rechargeData?.totalAmountRazorPayCharged || 0,
        recharge_id: rechargeID,
        payment_id: paymentId,
        recharge_status: 'Pending',
        payment_status: 'Pending',
        paymentHistory: [],
    });

    if (walletDoc) {
        return NextResponse.json({
            status: true,
            message: 'Wallet charged successfully',
            data: {
                walletObjectId: walletDoc._id,
                recharge_id: walletDoc.recharge_id,
                isPaymentTake: true,
                razorPayKeyId: process.env.razorPay_Key_Id || '',
                razorPaySecretKey: process.env.razorPay_Secret_Key || '',
            },
        });
    } else {
        return NextResponse.json({ status: false, message: 'wallet not charged' }, { status: 500 });
    }

}
