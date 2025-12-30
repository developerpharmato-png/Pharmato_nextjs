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

const razorpayInstance = new Razorpay({
    key_id: process.env.razorPay_Key_Id || '',
    key_secret: process.env.razorPay_Secret_Key || ''
});

/**
 * @swagger
 * /api/razorpay/webhook:
 *   post:
 *     summary: Razorpay webhook endpoint
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

    if (body?.payload?.payment?.entity) {
        let paymentHistory: any = {};
        let refundHistory: any = [];
        const entity = body.payload.payment.entity;
        console.log(entity);
        const orderId = entity.notes?.razorpay_order_id;

        paymentHistory.orderId = orderId;
        paymentHistory.entity = entity;

        const refundId = body?.payload?.refund?.entity?.id || '';

        // Find the order in DB
        const checkOrder = await Order.findOne({ order_id: orderId });

        if (checkOrder) {

            refundHistory = checkOrder?.refundHistory || [];

            const checkRefundHistory = refundHistory.find((obj: any) => obj.refundId == refundId)

            if (checkRefundHistory) {

                for (const element of refundHistory) {

                    if (element.refundId == refundId) {
                        element.status = body?.payload?.refund?.entity?.status || '';
                        element.payload.push(body?.payload)
                    }

                }

            } else {

                const data = {
                    orderId: orderId,
                    refundId: refundId,
                    status: body?.payload?.refund?.entity?.status || '',
                    amount: body?.payload?.refund?.entity?.amount || 0,
                    currency: body?.payload?.refund?.entity?.currency || '',
                    reason: body?.payload?.refund?.entity?.reason || '',
                    created_at: body?.payload?.refund?.entity?.created_at || 0,
                    payload: body?.payload,

                }

                refundHistory.push(data);

            }

            if (body.event === 'payment.authorized') {
                const amount = entity.amount;
                const currency = entity.currency;

                await Order.updateOne(
                    { _id: checkOrder._id },
                    {
                        $push: { paymentHistory: paymentHistory },
                        $set: {
                            payment_mode: entity.method || '',
                            payment_id: entity.id || '',
                        }
                    }
                );

                // Update paymentStatus in Firebase Realtime Database
                if (checkOrder?.order_id && entity?.status) {
                    const db = getDb();
                    await db
                        .ref(`orders/${checkOrder.order_id}`)
                        .update({
                            paymentStatus: entity.status
                        });
                }


                try {
                    const captureResponse = await razorpayInstance.payments.capture(entity.id, amount, currency);
                } catch (error) { }
            }

            if (body.event === 'payment.captured') {
                await Order.updateOne(
                    { _id: checkOrder._id },
                    {
                        $push: { paymentHistory: paymentHistory },
                        $set: {
                            payment_mode: entity.method || '',
                            payment_id: entity.id || '',
                            payment_status: entity.status || '',
                            order_status: 'Order Placed'
                        }
                    }
                );

                // Update paymentStatus in Firebase Realtime Database
                if (checkOrder?.order_id && entity?.status) {
                    const db = getDb();
                    //Firebase realtime data update
                    const firebaseRef = db.ref(`orders/${checkOrder.order_id}`);
                    const snapshot = await firebaseRef.once('value');
                    const isOrderStatusChanged: any = Number(snapshot.val()?.isOrderStatusChanged || 0) + 1
                    await firebaseRef.update({
                        isOrderStatusChanged: isOrderStatusChanged,
                        paymentStatus: entity.status
                    });
                }

                try {
                    const updatedOrder = await Order.findById(checkOrder._id).lean();
                    let user = null;
                    if (updatedOrder && typeof updatedOrder === 'object' && !Array.isArray(updatedOrder) && 'userId' in updatedOrder) {
                        user = await User.findById((updatedOrder as any).userId).lean();
                    }
                    const amountValue = typeof entity.amount === 'number' ? entity.amount / 100 : 0;
                    const subject = `Payment received for Order ${checkOrder.order_id}`;
                    let userName = 'Customer';
                    let userEmail = '';
                    if (user && typeof user === 'object' && !Array.isArray(user)) {
                        userName = (user as any).name || 'Customer';
                        userEmail = (user as any).email || '';
                    }
                    const html = `
                        <div>
                            <p>Dear ${userName},</p>
                            <p>Your payment has been captured successfully.</p>
                            <ul>
                                <li>Order ID: ${checkOrder.order_id}</li>
                                <li>Payment ID: ${entity.id}</li>
                                <li>Amount: ${amountValue} ${entity.currency || ''}</li>
                                <li>Method: ${entity.method || ''}</li>
                                <li>Status: ${entity.status || ''}</li>
                            </ul>
                            <p>Thank you for shopping with us.</p>
                        </div>
                    `;
                    if (userEmail) {
                        await sendEmail({ to: userEmail, subject, html });
                    }

                    let notificationUserId = '';
                    if (updatedOrder && typeof updatedOrder === 'object' && !Array.isArray(updatedOrder) && 'userId' in updatedOrder) {
                        notificationUserId = (updatedOrder as any).userId?.toString() || '';
                    }
                    await Notification.create({
                        userId: notificationUserId,
                        role: 'customer',
                        title: 'Order Placed',
                        message: checkOrder.isPrescriptionRequired !== true ? `Your Order ${checkOrder.order_id} has been placed successfully. It will be delievered to you soon.` : `Your Order ${checkOrder.order_id} has been placed successfully. We will Notify you when your prescription is approved.`,
                        type: 'payment',
                        targetScreen: 'orders/detail',
                        targetId: checkOrder._id.toString(),
                        meta: {
                            paymentId: entity.id,
                            amount: amountValue,
                            currency: entity.currency,
                            method: entity.method,
                            status: entity.status
                        }
                    });

                    // Send push notification to customer if deviceToken exists
                    if (user && (user as any).deviceToken) {
                        try {
                            await sendPushNotificationWithData({
                                token: (user as any).deviceToken,
                                title: 'Pharmato',
                                body: checkOrder.isPrescriptionRequired !== true ? `Your Order ${checkOrder.order_id} has been placed successfully. It will be delievered to you soon.` : `Your Order ${checkOrder.order_id} has been placed successfully. We will Notify you when your prescription is approved.`,
                                data: {
                                    orderId: checkOrder._id.toString(),
                                    type: 'order_placed',
                                    targetScreen: 'orders/detail',
                                    paymentId: entity.id,
                                    amount: amountValue,
                                    currency: entity.currency,
                                    method: entity.method,
                                    status: entity.status
                                }
                            });
                        } catch (err) {
                            console.error('Failed to send push notification:', err);
                        }
                    }

                    // Notify admin (store manager) and superadmins with detailed message
                    let storeName = '';
                    let adminName = '';
                    let adminRoleName = '';
                    let customerName = userName;
                    if (updatedOrder && typeof updatedOrder === 'object' && !Array.isArray(updatedOrder) && 'storeId' in updatedOrder) {
                        const storeId = (updatedOrder as any).storeId;
                        if (storeId) {
                            const store = await Store.findById(storeId).lean();
                            if (store && typeof store === 'object' && !Array.isArray(store)) {
                                storeName = (store as any).name || '';
                                if ('adminManagerId' in store && store.adminManagerId) {
                                    const admin = await Admin.findById((store as any).adminManagerId).lean();
                                    if (admin && typeof admin === 'object' && !Array.isArray(admin)) {
                                        adminName = (admin as any).name || '';
                                        // Try to get admin's role name
                                        if ('roleId' in admin && admin.roleId) {
                                            const roleDoc = await (await import('@/models/Role')).default.findById(admin.roleId).lean();
                                            if (roleDoc && typeof roleDoc === 'object' && !Array.isArray(roleDoc)) {
                                                adminRoleName = (roleDoc as any).name || '';
                                            }
                                        }
                                        // Notify store admin
                                        await Notification.create({
                                            userId: (store as any).adminManagerId.toString(),
                                            role: 'admin',
                                            title: 'New Order Received',
                                            message: `Admin ${adminName} (${adminRoleName}) received a new order for store ${storeName}. Customer: ${customerName}. Order ID: ${checkOrder.order_id}.`,
                                            type: 'order',
                                            targetScreen: 'orders/detail',
                                            targetId: checkOrder._id.toString(),
                                            meta: {
                                                paymentId: entity.id,
                                                amount: amountValue,
                                                currency: entity.currency,
                                                method: entity.method,
                                                status: entity.status
                                            }
                                        });
                                    }
                                }
                            }
                        }
                    }

                    // Notify all superadmins
                    try {
                        const superAdminRole = await (await import('@/models/Role')).default.findOne({ name: /superadmin/i });
                        if (superAdminRole && superAdminRole._id) {
                            const superAdmins = await Admin.find({ roleId: superAdminRole._id }).lean();
                            for (const superAdmin of superAdmins) {
                                if (superAdmin && typeof superAdmin === 'object' && !Array.isArray(superAdmin) && 'id' in superAdmin) {
                                    await Notification.create({
                                        userId: (superAdmin as any)._id.toString(),
                                        role: 'admin',
                                        title: 'New Order Received',
                                        message: `Admin ${adminName} (${adminRoleName}) received a new order for store ${storeName}. Customer: ${customerName}. Order ID: ${checkOrder.order_id}.`,
                                        type: 'order',
                                        targetScreen: 'orders/detail',
                                        targetId: checkOrder._id.toString(),
                                        meta: {
                                            paymentId: entity.id,
                                            amount: amountValue,
                                            currency: entity.currency,
                                            method: entity.method,
                                            status: entity.status
                                        }
                                    });
                                }
                            }
                        }
                    } catch (err) {
                        console.error('Superadmin notification error:', err);
                    }
                } catch (notifyErr) {
                    console.error('Notify/email error on payment captured:', notifyErr);
                }
            }

            if (body.event === 'payment.failed') {
                await Order.updateOne(
                    { _id: checkOrder._id },
                    {
                        $push: { paymentHistory: paymentHistory },
                        $set: {
                            payment_status: 'Failed',
                            order_status: 'pending'
                        }
                    }
                );

                // Update paymentStatus in Firebase Realtime Database
                if (checkOrder?.order_id && entity?.status) {
                    const db = getDb();
                    //Firebase realtime data update
                    const firebaseRef = db.ref(`orders/${checkOrder.order_id}`);
                    const snapshot = await firebaseRef.once('value');
                    const isOrderStatusChanged: any = Number(snapshot.val()?.isOrderStatusChanged || 0) + 1
                    await firebaseRef.update({
                        isOrderStatusChanged: isOrderStatusChanged,
                        paymentStatus: entity.status
                    });
                }

            }

            if (body.event == 'refund.created') {

                await Order.updateOne(
                    { _id: checkOrder._id },
                    {
                        $set: { refundHistory: refundHistory }
                    }
                );

            }

            if (body.event == 'refund.processed') {

                await Order.updateOne(
                    { _id: checkOrder._id },
                    {
                        $set: { refundHistory: refundHistory }
                    }
                );

            }

            if (body.event == 'refund.failed') {

                await Order.updateOne(
                    { _id: checkOrder._id },
                    {
                        $set: { refundHistory: refundHistory }
                    }
                );

            }

            if (body.event == 'refund.speed_changed') {

                await Order.updateOne(
                    { _id: checkOrder._id },
                    {
                        $set: { refundHistory: refundHistory }
                    }
                );

            }

        }
    }

    return NextResponse.json({ status: true, message: 'Webhook processed (direct)' });
}
