import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import Notification from '@/models/Notification';
import { sendPushNotificationWithData } from '@/utils/firebase.helper';
import User from '@/models/User';
import { sendEmail } from '@/utils/sendEmail';
import Store from '@/models/Store';
import Admin from '@/models/Admin';
import Razorpay from 'razorpay';
import { getDb } from '@/utils/firebase.helper';
import fs from 'fs';
import path from 'path';
import Wallet from '@/models/Wallet';
import mongoose from 'mongoose';

const razorpayInstance = new Razorpay({
    key_id: process.env.razorPay_Key_Id || '',
    key_secret: process.env.razorPay_Secret_Key || ''
});

async function runBackground(body: any) {

    if (body?.payload?.payment?.entity) {
        let paymentHistory: any = {};
        const entity = body.payload.payment.entity;
        // console.log(entity);
        const walletRechargeId = entity.notes?.recharge_id;

        paymentHistory.orderId = walletRechargeId || '';
        paymentHistory.entity = entity;

        // Find the order in DB
        const checkWallet = await Wallet.findOne({ recharge_id: walletRechargeId });

        if (checkWallet) {

            if (body.event === 'payment.authorized') {
                const amount = entity.amount;
                const currency = entity.currency;

                await Wallet.updateOne(
                    { _id: checkWallet._id },
                    {
                        $push: { paymentHistory: paymentHistory },
                        $set: {
                            payment_mode: entity.method || '',
                            payment_id: entity.id || '',
                        }
                    }
                );

                try {
                    const captureResponse = await razorpayInstance.payments.capture(entity.id, amount, currency);
                } catch (error) { }
            }

            if (body.event === 'payment.captured') {

                await Wallet.updateOne(
                    { _id: checkWallet._id },
                    {
                        $push: { paymentHistory: paymentHistory },
                        $set: {
                            payment_mode: entity.method || '',
                            payment_id: entity.id || '',
                            payment_status: entity.status || '',
                            recharge_status: 'Success'
                        }
                    }
                );

                // Update paymentStatus in Firebase Realtime Database
                if (checkWallet?.recharge_id) {
                    const db = getDb();
                    //Firebase realtime data update
                    const firebaseRef = db.ref(`wallet/recharge/${(checkWallet.userId).toString()}`);
                    const snapshot = await firebaseRef.once('value');
                    const isRechargeStatusChanged: any = Number(snapshot.val()?.isRechargeStatusChanged || 0) + 1
                    await firebaseRef.update({
                        isRechargeStatusChanged: isRechargeStatusChanged
                    });
                }

                const userObjectId =
                    typeof checkWallet.userId === 'string'
                        ? new mongoose.Types.ObjectId(checkWallet.userId)
                        : checkWallet.userId;

                await User.updateOne(
                    { _id: userObjectId },
                    { $inc: { walletAmount: Number(checkWallet.amount || 0) } }
                );

                const user = await User.findOne({ _id: userObjectId })

                await Notification.create({
                    userId: userObjectId.toString(),
                    role: 'customer',
                    title: 'Wallet Recharge',
                    message: `Wallet Updated : Wallet  Recharge Successful, ₹${checkWallet.amount} ready for your next medicine order.`,
                    type: 'payment',
                    targetScreen: 'wallet',
                    targetId: userObjectId.toString(),
                    meta: {}
                });

                // Send push notification to customer if deviceToken exists
                if (user && (user as any).deviceToken) {
                    try {
                        await sendPushNotificationWithData({
                            token: (user as any).deviceToken,
                            title: 'Pharmato',
                            body: `Wallet  Recharge Successful.`,
                            data: {
                                targetId: userObjectId.toString(),
                                targetScreen: 'wallet'
                            }
                        });
                    } catch (err) {
                        console.error('Failed to send push notification:', err);
                    }
                }

            }

            if (body.event === 'payment.failed') {
                await Wallet.updateOne(
                    { _id: checkWallet._id },
                    {
                        $push: { paymentHistory: paymentHistory },
                        $set: {
                            payment_status: 'Failed',
                            recharge_status: 'pending'
                        }
                    }
                );

            }

        }
    }

}


/**
 * @swagger
 * /api/customer/wallet/razorpay/webhook:
 *   post:
 *     summary: Razorpay webhook endpoint
 *     tags:
 *       - Wallet
 *     description: Receives payment and order events from Razorpay
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook received
 *       400:
 *         description: Invalid signature
 */

export async function POST(req: NextRequest) {
    await dbConnect();
    const body = await req.json();

    // 👇 Razorpay ko turant bharosa do
    const response = NextResponse.json({
        status: true,
        message: 'Webhook received'
    });

    setImmediate(() => {
        runBackground(body);
    });

    return response;
}
