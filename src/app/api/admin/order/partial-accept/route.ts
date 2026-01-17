import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import { getDb, sendPushNotificationWithData } from '@/utils/firebase.helper';
import Notification from '@/models/Notification';
import Razorpay from 'razorpay';
import User from '@/models/User';
import Medicine from '@/models/Medicine';
import { sendEmail } from '@/utils/sendEmail';
import fs from 'fs';
import path from 'path';
import Wallet from '@/models/Wallet';

const razorpayInstance = new Razorpay({
    key_id: process.env.razorPay_Key_Id || '',
    key_secret: process.env.razorPay_Secret_Key || ''
});

/**
 * @swagger
 * /api/admin/order/partial-accept:
 *   post:
 *     summary: Accept selected medicines in an order, cancel the rest
 *     tags:
 *       - Admin Orders
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId:
 *                 type: string
 *                 description: Order's ObjectId
 *                 required: true
 *               medicineIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of medicine ObjectIds to accept
 *                 required: true
 *     responses:
 *       200:
 *         description: Medicines accepted/cancelled successfully
 *       400:
 *         description: Missing or invalid input
 *       404:
 *         description: Order not found
 */

export async function POST(req: NextRequest) {
    await dbConnect();
    try {
        const { orderId, medicineIds, cancelReason } = await req.json();
        if (!orderId || !Array.isArray(medicineIds)) {
            return NextResponse.json({ success: false, message: 'orderId and medicineIds are required' }, { status: 400 });
        }
        const order = await Order.findOne({ _id: orderId });
        if (!order) {
            return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
        }
        // Get user info
        const user = await User.findById(order.userId);
        let refundAmount = 0;

        order.medicineQuantity = order.medicineQuantity.map((item: any) => {
            // Only update pending medicines
            if (item.status !== 'pending') return item;
            if (medicineIds.includes(item.medicineId.toString())) {
                const cancelDetail = {
                    is_cancelled: false,
                    quantity: 0,
                    reason: "",
                    cancelled_at: new Date()
                };
                return { ...item, status: 'accepted', cancelReason: '', cancelDetail };
            } else {
                const cancelDetail = {
                    is_cancelled: true,
                    quantity: item.quantity,
                    reason: cancelReason || 'Cancelled by admin (not selected for acceptance)',
                    cancelled_at: new Date()
                };
                return { ...item, status: 'cancelled', cancelReason: cancelReason || 'Cancelled by admin (not selected for acceptance)', cancelDetail };
            }
        });
        const unCancelledItems = order.medicineQuantity.filter((item: any) => item.status !== 'cancelled');
        if (unCancelledItems.length === 0) {
            order.order_status = 'Cancelled';
        } else {
            order.order_status = 'Confirmed';
        }
        await order.save();

        let userName = 'Customer';
        let userEmail = '';
        const deliveredAddr: any = order.deliveredAddress || null;
        if (deliveredAddr) {
            userName = deliveredAddr?.name || 'Customer';
            userEmail = deliveredAddr?.email || '';
        }


        // Choose template based on create or update
        const headerPath = path.join(process.cwd(), 'src/app/api/admin/html-templates/emailHeader.html');
        const footerPath = path.join(process.cwd(), 'src/app/api/admin/html-templates/emailFooter.html');
        const header = fs.readFileSync(headerPath, 'utf8');
        const footer = fs.readFileSync(footerPath, 'utf8');

        // console.log(order.medicineQuantity);

        // Use the same cancelledItems array for refund logic
        const cancelledForRefund = order.medicineQuantity.filter((item: any) => item.status === 'cancelled');

        if (cancelledForRefund.length > 0) {

            if (order.payment_mode === 'Wallet') {                
                
                    await User.updateOne(
                        { _id: user._id },
                        { $inc: { walletAmount: Number(refundAmount || 0) } }
                    );

                const walletDoc = await Wallet.create({
                    userId: user._id,
                    payment_mode: 'Admin Refund',
                    amount: refundAmount || 0,
                    totalAmount: refundAmount || 0,
                    razorPay_total_tax_charged: 0,
                    recharge_id: "",
                    payment_id: "",
                    recharge_status: 'Success',
                    payment_status: 'Refunded',
                    wallet_transaction_type: 'Refund',
                    transaction_to: `Wallet`,
                    paymentHistory: [],
                });

            } else {

                refundAmount = cancelledForRefund.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
                try {
                    const refundResponse = await razorpayInstance.payments.refund(order.payment_id, {
                        amount: refundAmount * 100
                    });
                } catch (error) { }
                // console.log("$$$$$refundAmount$$$$$$", refundAmount);

            }
        }

        // Fetch medicine names for both accepted and cancelled
        const [acceptedNames, cancelledNames] = await Promise.all([
            Medicine.find({ _id: { $in: unCancelledItems.map((i: any) => i.medicineId) } }).select('name'),
            Medicine.find({ _id: { $in: cancelledForRefund.map((i: any) => i.medicineId) } }).select('name'),
        ]);

        // Build email HTML
        let html = `${header}<div><p>Dear ${userName},</p>`;
        html += `<p>The admin has updated your order (Order ID: <b>${order.order_id || order._id}</b>).</p>`;


        let emailSubject: any = `Order Update: Partial Acceptance`;

        if (cancelledNames.length === 0) {

            emailSubject = `Order Confirmed Successfully– Order #${order.order_id}`;
            html += `<p>All medicines in your order have been accepted.</p>`;

        }

        if (acceptedNames.length === 0) {

            emailSubject = `Order Cancelled Successfully– Order #${order.order_id}`;
            html += `<p>All medicines in your order have been cancelled.</p>`;

        }

        if (acceptedNames.length > 0) {
            html += '<p><b>Accepted Medicines:</b><ul>';
            acceptedNames.forEach((m: any) => { html += `<li>${m.name}</li>`; });
            html += '</ul></p>';
        }
        if (cancelledNames.length > 0) {
            html += '<p><b>Cancelled Medicines:</b><ul>';
            cancelledNames.forEach((m: any) => { html += `<li>${m.name}</li>`; });
            html += `</ul><b>Refund Amount:</b> ₹${refundAmount}</p>`;
        }
        html += '<p>You can track your order status anytime from the My Orders section on the Pharmato app or website.</p>';
        html += '<p>If you have any questions or need assistance, our support team is always here to help.</p>';
        html += '<p>Thank you for choosing Pharmato for your healthcare needs.</p>';
        html += '<p>Stay healthy,<br/>Team Pharmato<br/>Your trusted pharmacy partner</p></div>';
        html += `${footer}`;

        if (userEmail) {
            await sendEmail({ to: userEmail, subject: emailSubject, html });
        }

        console.log("$$$acceptedNames$$$$$$$$cancelledNames$$", acceptedNames, cancelledNames);

        // Update orderStatus in Firebase Realtime Database
        if (order?.order_id) {
            const db = getDb();
            const firebaseRef = db.ref(`orders/${order.order_id}`);
            const snapshot = await firebaseRef.once('value');
            const isOrderStatusChanged: any = Number(snapshot.val()?.isOrderStatusChanged || 0) + 1;
            await firebaseRef.update({
                isOrderStatusChanged: isOrderStatusChanged
            });
        }

        // Create in-app notification for customer and send push notification if device token exists
        try {
            const title = `Order Update`;
            const message = `Your order ${order.order_id || ''} status is now ${order.order_status}`;
            // Create in-app notification
            await Notification.create({
                userId: order.userId?.toString?.() || (user?._id?.toString?.() || ''),
                role: 'customer',
                title,
                message,
                type: 'order_status',
                targetScreen: 'orders/detail',
                targetId: order._id?.toString?.(),
                isRead: false,
                meta: { orderId: order.order_id, status: order.order_status }
            });

            // Send push if device token available
            const deviceToken = user?.deviceToken || (user && (user as any).deviceToken);
            if (deviceToken) {
                try {
                    await sendPushNotificationWithData({
                        token: deviceToken,
                        title: `Order ${order.order_id} updated`,
                        body: message,
                        data: {
                            targetId: order._id?.toString?.(),
                            orderId: order._id?.toString?.(),
                            orderStatus: order.order_status,
                            screen: 'order'
                        }
                    });
                } catch (err) {
                    console.error('Failed to send push notification (partial-accept):', err);
                }
            }
        } catch (notifErr) {
            console.error('Notification create/send error (partial-accept):', notifErr);
        }

        return NextResponse.json({ success: true, message: 'Selected medicines accepted, rest cancelled', data: order });
    } catch (error) {
        console.error('Partial accept error:', error);
        return NextResponse.json({ success: false, message: 'Failed to accept/cancel medicines', error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
}
