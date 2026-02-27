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
import Medicine from '@/models/Medicine';

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

        // Choose template based on create or update
        const headerPath = path.join(process.cwd(), 'src/app/api/admin/html-templates/emailHeader.html');
        const footerPath = path.join(process.cwd(), 'src/app/api/admin/html-templates/emailFooter.html');
        const header = fs.readFileSync(headerPath, 'utf8');
        const footer = fs.readFileSync(footerPath, 'utf8');

        // Send notification to user
        const user = await User.findById(order.userId);
        const messageInApp = status == 'Delivered' ? `Delievery Successful : Your medicines have been delivered successfully at your doorstep.` : `Your order (Order ID: ${order.order_id || order._id}) status is now: ${status}`;
        const messagePush = status == 'Delivered' ? `Your Order has been delivered successfully.` : `Your order (Order ID: ${order.order_id || order._id}) status is now: ${status}`;

        if (user && user.deviceToken) {
            await sendPushNotificationWithData({
                token: user.deviceToken,
                title: 'Order Status Updated',
                body: messagePush,
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
                message: messageInApp,
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
        let invoiceUrl = '';
        const deliveredAddr: any = order.deliveredAddress || null;
        if (deliveredAddr) {
            userName = deliveredAddr?.name || 'Customer';
            userEmail = deliveredAddr?.email || '';
        }

        let deliveryAddressText = ''
        if (deliveredAddr) {
            deliveryAddressText = `${deliveredAddr.address.houseNumber}, ${deliveredAddr.address.locality}, ${deliveredAddr.address.landmark}, ${deliveredAddr.address.city}, ${deliveredAddr.address.state} - ${deliveredAddr.address.pinCode}`;
        }

        invoiceUrl = order.invoice_url || '';

        const [checkMedicineId] = await Promise.all([
            Medicine.find({ _id: { $in: order.medicineId.map((i: any) => i) } }).select('_id name coverImage images'),
        ]);

        const checkMedicineQuantity = checkMedicineId.map((m: any) => {
            const item = order.medicineQuantity.find((i: any) => i.medicineId.toString() === m._id.toString());
            return {
                ...m._doc,
                quantity: item ? item?.quantity : 0,
                price: item ? item?.price : 0,
                status: item ? item?.status : 'accepted'
            };
        });

        const acceptedNames = checkMedicineQuantity.filter((m: any) => m.status == 'accepted');
        const cancelledNames = checkMedicineQuantity.filter((m: any) => m.status == 'cancelled');

        const refundAmount = cancelledNames.reduce((sum: number, m: any) => sum + (Number(m.price) * Number(m.quantity)), 0);

        let itemsHtml = '';

        if (acceptedNames.length > 0) {
            const defaultImg = 'https://res.cloudinary.com/dqkyleb0t/image/upload/v1768817395/medicine_img-1_sg5xaj.jpg';

            itemsHtml += `
                        <ul style="list-style:none;padding:0;">
                    `;

            acceptedNames.forEach((m: any) => {
                const imgSrc =
                    m.coverImage && m.coverImage.trim() !== ''
                        ? m.coverImage
                        : defaultImg;

                itemsHtml += `
                            <li style="margin-bottom:10px;display:flex;align-items:center;">
                                <img src="${imgSrc}" 
                                     alt="${m.name}" 
                                     style="width:40px;height:40px;object-fit:cover;border-radius:6px;margin-right:10px;border:1px solid #eee;" />
                                <div>
                                    <div style="font-weight:500;">${m.name}</div>
                                    <div style="font-size:14px;color:#555;">
                                        Quantity: ${m.quantity}, 
                                        Price: ₹${Number(m.price).toFixed(2)}
                                    </div>
                                </div>
                            </li>
                        `;
            });

            itemsHtml += `</ul>`;
        }

        // If order is delivered, send delivered email to customer
        try {
            const statusLower = String(status || '').toLowerCase();
            if (statusLower.includes('deliv')) {

                const subject = `Order Delivered Successfully`;

                const html = `
${header}

<div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px 0;">
  <div style="max-width:700px;margin:0 auto;background:#ffffff;padding:25px;border:1px solid #e6e6e6;border-radius:8px;">

    <p>Hello ${userName},</p>

    <p>Your order has been Delivered successfully. We hope you’re satisfied with your purchase.</p>

    <!-- Order Summary -->
    <h3 style="margin-top:25px;">Order Summary</h3>
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="padding:8px;border:1px solid #eee;font-weight:600;">Order ID</td>
        <td style="padding:8px;border:1px solid #eee;">#${order.order_id || order._id}</td>
      </tr>
      <tr>
        <td style="padding:8px;border:1px solid #eee;font-weight:600;">Order Status</td>
        <td style="padding:8px;border:1px solid #eee;">Delivered</td>
      </tr>
      <tr>
        <td style="padding:8px;border:1px solid #eee;font-weight:600;">Delivery Address</td>
        <td style="padding:8px;border:1px solid #eee;">${deliveryAddressText}</td>
      </tr>
    </table>

    <!-- Items -->
    <h3 style="margin-top:25px;">Delivered Medicines</h3>
    ${itemsHtml}

    <!-- Payment Details -->
    <h3 style="margin-top:25px;">Payment Details</h3>
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="padding:8px;border:1px solid #eee;">Subtotal</td>
        <td style="padding:8px;border:1px solid #eee;">
          ₹${order.calculationData.priceTotalSumBeforeDiscount}
        </td>
      </tr>
      
      ${order.calculationData.deliveryFee > 0 ? `       <tr>
        <td style="padding:8px;border:1px solid #eee;">Delivery Charges</td>
        <td style="padding:8px;border:1px solid #eee;">
          ₹${order.calculationData.deliveryFee}
        </td>
      </tr>` : ``}
      
      ${order.discount > 0 ? ` <tr>
        <td style="padding:8px;border:1px solid #eee;">Discount</td>
        <td style="padding:8px;border:1px solid #eee;">
          ₹${order.discount}
        </td>
      </tr>` : ``}

      <tr>
        <td style="padding:8px;border:1px solid #eee;font-weight:600;">
          Total Amount Paid
        </td>
        <td style="padding:8px;border:1px solid #eee;font-weight:600;">
          ₹${order.total_order_amount}
        </td>
      </tr>
      <tr>
        <td style="padding:8px;border:1px solid #eee;">Payment Method</td>
        <td style="padding:8px;border:1px solid #eee;">
          ${order.payment_mode.toUpperCase()}
        </td>
      </tr>
    </table>    

    ${refundAmount > 0 ? `<h3 style="margin-top:25px;">Refund Information</h3>
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="padding:8px;border:1px solid #eee;">Refund Amount</td>
        <td style="padding:8px;border:1px solid #eee;">
          ₹${refundAmount.toFixed(2)}
        </td>
      </tr>
    </table>` : ''}

    <p style="margin-top:25px;">
      You can download your invoice for this order by clicking the button below:
    </p>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                    <td align="center">
                        <a href="${invoiceUrl}" target="_blank"
                           style="background-color: #5DAC5D; color: #ffffff; 
                                  padding: 14px 30px; text-decoration: none; 
                                  border-radius: 6px; font-weight: bold; 
                                  display: inline-block; font-size: 15px;">
                            Download Invoice
                        </a>
                    </td>
                </tr>
    </table>

    <p style="margin-top:25px;">
      You can also view your order details anytime from the My Orders section in the Pharmato app or website.
    </p>

    <p>
      Thank you for choosing Pharmato for your healthcare needs. We’re committed to delivering your medicines safely and on time.

    </p>

    <p>
      Stay Healthy,<br/>
      <strong>Team Pharmato</strong><br/>
      Your trusted pharmacy partner
    </p>

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

        // const store: any = await Store.findById(order.storeId).lean();
        let storeName = ``;
        let adminName = '';
        let adminEmail = '';

        // Notify admin (store manager) and superadmins with detailed message
        if (order.storeId) {
            const storeId = (order as any).storeId;
            if (storeId) {
                const store = await Store.findById(storeId).lean();
                if (store && typeof store === 'object' && !Array.isArray(store)) {
                    storeName = (store as any).name || '';
                    if ('adminManagerId' in store && store.adminManagerId) {
                        const admin = await Admin.findById((store as any).adminManagerId).lean();
                        if (admin && typeof admin === 'object' && !Array.isArray(admin)) {
                            adminName = (admin as any).name || '';
                            adminEmail = (admin as any).email || '';

                            let storeNotMsg: any = `Order Delivered Successfully: Order #${order.order_id} has been delivered.`;

                            // Notify store admin
                            await Notification.create({
                                userId: (store as any).adminManagerId.toString(),
                                role: 'admin',
                                title: 'Order Delivered',
                                message: storeNotMsg,
                                type: 'order',
                                targetScreen: 'orders/detail',
                                targetId: order._id.toString(),
                                meta: {}
                            });
                            // Send email to adminEmail
                            if (adminEmail) {
                                const adminHtml = `
                                                                        ${header}

                                                                     <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px 0;">
  <div
    style="max-width:700px;margin:0 auto;background:#ffffff;padding:25px;border:1px solid #e6e6e6;border-radius:8px;">

    <p>Hello ${adminName || 'Store Manager'},</p>

    <p style="color:#28a745; font-weight:600;">
      The following order has been successfully Delivered to the customer.
    </p>

    <!-- Order Details -->
    <h3 style="margin-top:25px;">Order Details</h3>
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="padding:8px;border:1px solid #eee;font-weight:600;">Order ID</td>
        <td style="padding:8px;border:1px solid #eee;">
          #${order.order_id}
        </td>
      </tr>
      <tr>
        <td style="padding:8px;border:1px solid #eee;font-weight:600;">Order Status</td>
        <td style="padding:8px;border:1px solid #eee;color:#28a745;font-weight:600;">
          Confirmed
        </td>
      </tr>
      <tr>
        <td style="padding:8px;border:1px solid #eee;font-weight:600;">Order Date & Time</td>
        <td style="padding:8px;border:1px solid #eee;">
          ${new Date(order.createdAt).toLocaleString()}
        </td>
      </tr>
    </table>

    <!-- Customer Details -->
    <h3 style="margin-top:25px;">Customer Details</h3>
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="padding:8px;border:1px solid #eee;">Customer Name</td>
        <td style="padding:8px;border:1px solid #eee;">
          ${order.deliveredAddress?.name}
        </td>
      </tr>
      <tr>
        <td style="padding:8px;border:1px solid #eee;">Mobile Number</td>
        <td style="padding:8px;border:1px solid #eee;">
          ${order.deliveredAddress?.mobileNumber}
        </td>
      </tr>
      <tr>
        <td style="padding:8px;border:1px solid #eee;">Email ID</td>
        <td style="padding:8px;border:1px solid #eee;">
          ${order.userEmail}
        </td>
      </tr>
      <tr>
        <td style="padding:8px;border:1px solid #eee;">Delivery Address</td>
        <td style="padding:8px;border:1px solid #eee;">
          ${deliveryAddressText}
        </td>
      </tr>
    </table>

    <!-- Order Summary -->
    ${itemsHtml}

    <!-- Payment Summary -->
    <h3 style="margin-top:25px;">Payment Summary</h3>
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="padding:8px;border:1px solid #eee;">Subtotal</td>
        <td style="padding:8px;border:1px solid #eee;">
          ₹${order.calculationData.priceTotalSumBeforeDiscount}
        </td>
      </tr>
      <tr>
        <td style="padding:8px;border:1px solid #eee;">Delivery Charges</td>
        <td style="padding:8px;border:1px solid #eee;">
          ₹${order.calculationData.deliveryFee}
        </td>
      </tr>
      <tr>
        <td style="padding:8px;border:1px solid #eee;">Discount</td>
        <td style="padding:8px;border:1px solid #eee;">
          ₹${order.discount}
        </td>
      </tr>
      <tr>
        <td style="padding:8px;border:1px solid #eee;font-weight:600;">
          Total Paid
        </td>
        <td style="padding:8px;border:1px solid #eee;font-weight:600;">
          ₹${order.total_order_amount}
        </td>
      </tr>
      <tr>
        <td style="padding:8px;border:1px solid #eee;">Payment Method</td>
        <td style="padding:8px;border:1px solid #eee;">
          ${order.payment_mode.toUpperCase()}
        </td>
      </tr>
    </table>

    <h3 style="margin-top:25px;">Action Completed:</h3>
    <ul>
      <li>Order has been marked as successfully delivered.</li>
      <li>Inventory has been Updated accordingly.</li>
      <li>Invoice has been shared with the customer.</li>
      <li>This order can now be considered closed.</li>
    </ul>

    <p style="margin-top:25px;">
      Regards,<br />
      <strong>Team Pharmato</strong>
    </p>

  </div>
</div>
                                                                               
                                                                            ${footer}
                                                                        `;
                                await sendEmail({ to: adminEmail, subject: `Order Delivered Successfully `, html: adminHtml });
                            }

                            try {
                                const adminToken = (admin as any).deviceToken;
                                if (adminToken) {
                                    await sendPushNotificationWithData({
                                        token: adminToken,
                                        title: 'Pharmato',
                                        body: storeNotMsg,
                                        data: {
                                            targetId: order._id.toString(),
                                            orderId: order._id.toString(),
                                            type: 'order_update',
                                            targetScreen: 'orders/detail'
                                        }
                                    });
                                }
                            } catch (err) {
                                console.error('Failed to send push notification to admin:', err);
                            }

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

                    // Order #{OrderID} placed by {User Name} at store {Store Name} has been successfully delivered.

                    await Notification.create({
                        userId: (superAdmin as any)._id.toString(),
                        role: 'admin',
                        title: 'Order Delivered',
                        message: `Order Delivered: Order #${order.order_id} placed by ${userName} has been successfully delivered by ${storeName}.`,
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
                                body: `Order Delivered: Order #${order.order_id} placed by ${userName} has been successfully delivered by ${storeName}.`,
                                data: {
                                    targetId: order._id.toString(),
                                    orderId: order._id.toString(),
                                    type: 'order_delivered',
                                    targetScreen: 'orders/detail',
                                }
                            });
                        }
                    } catch (err) {
                        console.error('Failed to send push notification to superadmin:', err);
                    }

                    // If order is delivered, send delivered email to customer
                    try {
                        const statusLower = String(status || '').toLowerCase();
                        if (statusLower.includes('deliv')) {

                            const subject = `Order Delivered Successfully – Order #${order.order_id}`;
                            const html = `${header}

                            <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px 0;">
  <div
    style="max-width:700px;margin:0 auto;background:#ffffff;padding:25px;border:1px solid #e6e6e6;border-radius:8px;">

    <p>Hello Super Admin,</p>

    <p style="color:#28a745; font-weight:600;">
      The following order has been successfully delivered to the customer by the assigned store.
    </p>

    <!-- Store Details -->
    <h3 style="margin-top:25px;">Store Details</h3>
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="padding:8px;border:1px solid #eee;font-weight:600;">Store Name</td>
        <td style="padding:8px;border:1px solid #eee;">
          ${storeName}
        </td>
      </tr>
      <tr>
        <td style="padding:8px;border:1px solid #eee;font-weight:600;">Store Manager</td>
        <td style="padding:8px;border:1px solid #eee;">
          ${adminName}
        </td>
      </tr>
    </table>

    <!-- Order Details -->
    <h3 style="margin-top:25px;">Order Details</h3>
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="padding:8px;border:1px solid #eee;font-weight:600;">Order ID</td>
        <td style="padding:8px;border:1px solid #eee;">
          #${order.order_id}
        </td>
      </tr>
      <tr>
        <td style="padding:8px;border:1px solid #eee;font-weight:600;">Order Status</td>
        <td style="padding:8px;border:1px solid #eee;color:#28a745;font-weight:600;">
          Confirmed
        </td>
      </tr>
      <tr>
        <td style="padding:8px;border:1px solid #eee;font-weight:600;">Order Date & Time</td>
        <td style="padding:8px;border:1px solid #eee;">
          ${new Date(order.createdAt).toLocaleString()}
        </td>
      </tr>
    </table>

    <!-- Customer Details -->
    <h3 style="margin-top:25px;">Customer Details</h3>
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="padding:8px;border:1px solid #eee;">Customer Name</td>
        <td style="padding:8px;border:1px solid #eee;">
          ${order.deliveredAddress?.name}
        </td>
      </tr>
      <tr>
        <td style="padding:8px;border:1px solid #eee;">Mobile Number</td>
        <td style="padding:8px;border:1px solid #eee;">
          ${order.deliveredAddress?.mobileNumber}
        </td>
      </tr>
      <tr>
        <td style="padding:8px;border:1px solid #eee;">Email ID</td>
        <td style="padding:8px;border:1px solid #eee;">
          ${order.userEmail}
        </td>
      </tr>
      <tr>
        <td style="padding:8px;border:1px solid #eee;">Delivery Address</td>
        <td style="padding:8px;border:1px solid #eee;">
          ${deliveryAddressText}
        </td>
      </tr>
    </table>

    <!-- Order Summary -->
    ${itemsHtml}

    <!-- Payment Summary -->
    <h3 style="margin-top:25px;">Payment Summary</h3>
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="padding:8px;border:1px solid #eee;">Subtotal</td>
        <td style="padding:8px;border:1px solid #eee;">
          ₹${order.calculationData.priceTotalSumBeforeDiscount}
        </td>
      </tr>
      
      ${order.calculationData.deliveryFee > 0 ? `<tr>
        <td style="padding:8px;border:1px solid #eee;">Delivery Charges</td>
        <td style="padding:8px;border:1px solid #eee;">
          ₹${order.calculationData.deliveryFee}
        </td>
      </tr>` : ``}

      
      ${order.discount > 0 ? `<tr>
        <td style="padding:8px;border:1px solid #eee;">Discount</td>
        <td style="padding:8px;border:1px solid #eee;">
          ₹${order.discount}
        </td>
      </tr>` : ``}
      
      <tr>
        <td style="padding:8px;border:1px solid #eee;font-weight:600;">
          Total Paid
        </td>
        <td style="padding:8px;border:1px solid #eee;font-weight:600;">
          ₹${order.total_order_amount}
        </td>
      </tr>
      <tr>
        <td style="padding:8px;border:1px solid #eee;">Payment Method</td>
        <td style="padding:8px;border:1px solid #eee;">
          ${order.payment_mode.toUpperCase()}
        </td>
      </tr>
    </table>

    <p>No further action is required from the admin side.</p>

    <p style="margin-top:25px;">
      Regards,<br />
      <strong>Team Pharmato</strong>
    </p>

  </div>
</div>

                ${footer}
                `;

                            if (superAdmin.email) {
                                await sendEmail({ to: superAdmin.email, subject, html });
                            }
                        }
                    } catch (emailErr) {
                        console.error('Error sending delivered email:', emailErr);
                    }



                }
            }
        } catch (err) {
            console.error('Superadmin notification error:', err);
        }

        return NextResponse.json({ success: true, message: 'Order status updated', data: order });
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Failed to update order status', error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
}
