import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import User from '@/models/User';
import Notification from '@/models/Notification';
import { getDb, sendPushNotificationWithData } from '@/utils/firebase.helper';
import { sendEmail } from '@/utils/sendEmail';

export async function POST(req: NextRequest) {
    await dbConnect();
    try {
        const { orderId, status } = await req.json();
        if (!orderId || !status) {
            return NextResponse.json({ success: false, message: 'orderId and status are required' }, { status: 400 });
        }
        const order = await Order.findOne({ _id: orderId });
        if (!order) {
            return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
        }
        order.order_status = status;
        await order.save();

        // Update orderStatus in Firebase Realtime Database
        if (order?.order_id) {
            const db = getDb();
            //Firebase realtime data update
            const firebaseRef = db.ref(`orders/${order.order_id}`);
            const snapshot = await firebaseRef.once('value');
            const isOrderStatusChanged: any = Number(snapshot.val()?.isOrderStatusChanged || 0) + 1
            await firebaseRef.update({
                isOrderStatusChanged: isOrderStatusChanged
            });
        }

        // Send notification to user
        const user = await User.findById(order.userId);
        if (user && user.deviceToken) {
            await sendPushNotificationWithData({
                token: user.deviceToken,
                title: 'Order Status Updated',
                body: `Your order (Order ID: ${order.order_id || order._id}) status is now: ${status}`,
                data: {
                    orderId: order._id.toString(),
                    targetId: order._id.toString(),
                    type: 'order_status_update',
                    targetScreen: 'orders/detail',
                    status: status
                }
            });
        }

        // Send in-app notification to user
        if (user) {
            await Notification.create({
                userId: user._id,
                role: 'customer',
                title: 'Order Status Updated',
                message: `Your order (Order ID: ${order.order_id || order._id}) status is now: ${status}`,
                type: 'order',
                targetScreen: 'orders/detail',
                targetId: order._id.toString(),
                meta: {
                    status: status
                }
            });
        }

        // If order is delivered, send delivered email to customer
        try {
            const statusLower = String(status || '').toLowerCase();
            if (statusLower.includes('deliv')) {
                // format delivery address
                const orderData: any = order;
                const deliveredAddr: any = orderData.deliveredAddress.address || null;

                let deliveryAddressText = ''

                if (deliveredAddr) {
                    deliveryAddressText = `${deliveredAddr.houseNumber}, ${deliveredAddr.locality}, ${deliveredAddr.landmark}, ${deliveredAddr.city}, ${deliveredAddr.state} - ${deliveredAddr.pinCode}`;
                }

                const userName = (user && (user as any).name) ? (user as any).name : 'Customer';
                const userEmail = (user && (user as any).email) ? (user as any).email : '';
                const subject = `Order Delivered Successfully – Order #${order.order_id}`;
                const html = `
                    <div style="font-family: Arial, sans-serif; color:#333; line-height:1.4;">
                        <div style="max-width:700px;margin:0 auto;padding:20px;border:1px solid #e6e6e6;">
                            <p>Hello ${userName},</p>
                            <p>Your order <strong>#${order.order_id || order._id}</strong> has been delivered to you successfully.</p>
                            <h4>Order Summary:</h4>
                            <p>Order ID: <strong>#${order.order_id || order._id}</strong></p>
                            <p>Order Status: <strong>Delivered</strong></p>
                            <p>Delivery Address: ${deliveryAddressText || 'Not available'}</p>
                            <p>Thank you for choosing Pharmato for your healthcare needs. We’re committed to delivering your medicines safely and on time.</p>
                            <p>Stay healthy,<br/>Team Pharmato<br/>Your trusted pharmacy partner</p>
                        </div>
                    </div>
                `;

                if (userEmail) {
                    await sendEmail({ to: userEmail, subject, html });
                }
            }
        } catch (emailErr) {
            console.error('Error sending delivered email:', emailErr);
        }

        return NextResponse.json({ success: true, message: 'Order status updated', data: order });
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Failed to update order status', error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
}
