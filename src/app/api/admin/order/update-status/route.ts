import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import User from '@/models/User';
import Notification from '@/models/Notification';
import { getDb, sendPushNotificationWithData } from '@/utils/firebase.helper';
import { sendEmail } from '@/utils/sendEmail';
import fs from 'fs';
import path from 'path';
import Admin from '@/models/Admin';
import Store from '@/models/Store';

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

        let userName = 'Customer';
        let userEmail = '';
        const deliveredAddr: any = order.deliveredAddress.address || null;
        if (user && typeof user === 'object' && !Array.isArray(user)) {
            userName = (user as any).name || deliveredAddr?.name || 'Customer';
            userEmail = (user as any).email || deliveredAddr?.email || '';
        }

        const store : any = await Store.findById(order.storeId).lean();
        const storeName = store ? (store.name || 'Store') : 'Store';

        // Notify all superadmins
        try {
            const superAdminRole = await (await import('@/models/Role')).default.findOne({ name: /superadmin/i });
            if (superAdminRole && superAdminRole._id) {
                const superAdmins = await Admin.find({ roleId: superAdminRole._id }).lean();
                for (const superAdmin of superAdmins) {

                    // Order #{OrderID} placed by {User Name} at store {Store Name} has been successfully delivered.

                    await Notification.create({
                        userId: (superAdmin as any)._id.toString(),
                        role: 'admin',
                        title: 'Order Updated',
                        message: `Order #${order.order_id} placed by ${userName} at store ${storeName} has been successfully delivered.`,
                        type: 'order',
                        targetScreen: 'orders/detail',
                        targetId: order._id.toString(),
                        meta: {
                            orderId: order._id.toString(),
                        }
                    });

                    try {
                        const superToken = (superAdmin as any).deviceToken;
                        if (superToken) {
                            await sendPushNotificationWithData({
                                token: superToken,
                                title: 'Pharmato',
                                body: `Order #${order.order_id} has been successfully delivered to the customer.`,
                                data: {
                                    targetId: order._id.toString(),
                                    orderId: order._id.toString(),
                                    type: 'order_updated',
                                    targetScreen: 'orders/detail',
                                }
                            });
                        }
                    } catch (err) {
                        console.error('Failed to send push notification to superadmin:', err);
                    }

                }
            }
        } catch (err) {
            console.error('Superadmin notification error:', err);
        }

        // Choose template based on create or update
        const headerPath = path.join(process.cwd(), 'src/app/api/admin/html-templates/emailHeader.html');
        const footerPath = path.join(process.cwd(), 'src/app/api/admin/html-templates/emailFooter.html');
        const header = fs.readFileSync(headerPath, 'utf8');
        const footer = fs.readFileSync(footerPath, 'utf8');

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
                const html = `${header}
                    <div style="font-family: Arial, sans-serif; color:#333; line-height:1.4;">
                        <div style="max-width:700px;margin:0 auto;padding:20px;border:1px solid #e6e6e6;">
                            <p>Hello ${userName},</p>
                            <p>Your order has been delivered to you successfully.</p>
                            <h4>Order Summary:</h4>
                            <p>Order ID: <strong>#${order.order_id || order._id}</strong></p>
                            <p>Order Status: <strong>Delivered</strong></p>
                            <p>Delivery Address: ${deliveryAddressText || 'Not available'}</p>
                            <p>Thank you for choosing Pharmato for your healthcare needs. We’re committed to delivering your medicines safely and on time.</p>
                            <p>Stay healthy,<br/>Team Pharmato<br/>Your trusted pharmacy partner</p>
                        </div>
                    </div>
                ${footer}
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
