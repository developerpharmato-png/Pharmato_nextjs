import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import { getDb } from '@/utils/firebase.helper';
import Razorpay from 'razorpay';
import User from '@/models/User';
import Medicine from '@/models/Medicine';
import { sendEmail } from '@/utils/sendEmail';

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
            order.status = 'Cancelled';
        } else {
            order.status = 'Confirmed';
        }
        await order.save();

        // console.log(order.medicineQuantity);

        // Use the same cancelledItems array for refund logic
        const cancelledForRefund = order.medicineQuantity.filter((item: any) => item.status === 'cancelled');

        if (cancelledForRefund.length > 0) {
             refundAmount = cancelledForRefund.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
            try {
                const refundResponse = await razorpayInstance.payments.refund(order.payment_id, {
                    amount: refundAmount * 100
                });
            } catch (error) { }
            console.log("$$$$$refundAmount$$$$$$", refundAmount);
        }

        // Fetch medicine names for both accepted and cancelled
        const [acceptedNames, cancelledNames] = await Promise.all([
            Medicine.find({ _id: { $in: unCancelledItems.map((i: any) => i.medicineId) } }).select('name'),
            Medicine.find({ _id: { $in: cancelledForRefund.map((i: any) => i.medicineId) } }).select('name'),
        ]);

        // Build email HTML
        let html = `<div><p>Dear ${user?.name || 'Customer'},</p>`;
        html += `<p>The admin has updated your order (Order ID: <b>${order.order_id || order._id}</b>).</p>`;

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
        html += '<p>Thank you for your order.</p></div>';
        if (user?.email) {
            await sendEmail({ to: user.email, subject: `Order Update: Partial Acceptance`, html });
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

        return NextResponse.json({ success: true, message: 'Selected medicines accepted, rest cancelled', data: order });
    } catch (error) {
        console.error('Partial accept error:', error);
        return NextResponse.json({ success: false, message: 'Failed to accept/cancel medicines', error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
}
