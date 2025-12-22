import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import Notification from '@/models/Notification';
import User from '@/models/User';
import { sendEmail } from '@/utils/sendEmail';
import Store from '@/models/Store';
import Admin from '@/models/Admin';
import Razorpay from 'razorpay';

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
        const entity = body.payload.payment.entity;
        console.log(entity);
        const orderId = entity.notes?.razorpay_order_id;

        paymentHistory.orderId = orderId;
        paymentHistory.entity = entity;

        // Find the order in DB
        const checkOrder = await Order.findOne({ order_id: orderId });

        if (checkOrder) {
            if (body.event === 'payment.authorized') {
                const amount = entity.amount;
                const currency = entity.currency;

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
                            order_status: checkOrder.isPrescriptionRequired == true ? 'Ordered' : 'Confirmed'
                        }
                    }
                );

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
                        message: `Your Order ${checkOrder.order_id} has been placed successfully. It will be delievered to you soon.`,
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
                            order_status: 'Pending'
                        }
                    }
                );
            }
        }
    }

    return NextResponse.json({ status: true, message: 'Webhook processed (direct)' });
}
