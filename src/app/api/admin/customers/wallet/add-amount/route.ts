/**
 * @swagger
 * /api/admin/customers/wallet/add-amount:
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
 *               amount:
 *                 type: number
 *                 example: 1000
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
 */


import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Wallet from '@/models/Wallet';
import moment from 'moment';
import Notification from '@/models/Notification';
import { sendPushNotificationWithData } from '@/utils/firebase.helper';

export async function POST(request: NextRequest) {

    await dbConnect();
    const body = await request.json();
    const { userId, amount } = body;
    if (!userId || typeof userId !== 'string') {
        return NextResponse.json({ status: false, message: 'userId is required' }, { status: 400 });
    }
    const userCheck = await User.findOne({ _id: userId });
    if (!userCheck) {
        return NextResponse.json({ status: false, message: 'User not found' }, { status: 404 });
    }

    const walletDoc = await Wallet.create({
        userId: userCheck._id,
        payment_mode: 'Admin Added',
        amount: amount || 0,
        totalAmount: amount || 0,
        razorPay_total_tax_charged: 0,
        recharge_id: '',
        payment_id: '',
        recharge_status: 'Success',
        payment_status: 'Credited',
        wallet_transaction_type: 'Credit to',
        transaction_to: `Wallet`,
        paymentHistory: [],
    });

    await User.updateOne(
        { _id: userCheck._id },
        { $inc: { walletAmount: Number(amount || 0) } }
    );

    await Notification.create({
        userId: userCheck._id.toString(),
        role: 'customer',
        title: 'Wallet Credited',
        message: `🎉 Good news! ₹${amount} has been successfully credited to your wallet by Admin. You can use it for your next purchase. Happy shopping!`,
        type: 'payment',
        targetScreen: 'wallet',
        targetId: userCheck._id.toString(),
        meta: {}
    });

    // Send push notification to customer if deviceToken exists
    if (userCheck && (userCheck as any).deviceToken) {
        try {
            await sendPushNotificationWithData({
                token: (userCheck as any).deviceToken,
                title: 'Pharmato',
                body: `🎉 Good news! ₹${amount} has been successfully credited to your wallet by Admin. You can use it for your next purchase. Happy shopping!`,
                data: {
                    targetId: userCheck._id.toString(),
                    targetScreen: 'wallet'
                }
            });
        } catch (err) {
            console.error('Failed to send push notification:', err);
        }
    }

    return NextResponse.json({
        status: true,
        message: 'Amount added to wallet successfully'
    });

}
