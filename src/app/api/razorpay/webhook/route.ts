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
import Medicine from '@/models/Medicine';
import moment from 'moment-timezone';

const razorpayInstance = new Razorpay({
    key_id: process.env.razorPay_Key_Id || '',
    key_secret: process.env.razorPay_Secret_Key || ''
});

async function runBackground(body: any) {

    if (body?.payload?.payment?.entity) {
        let paymentHistory: any = {};
        let refundHistory: any = [];
        const entity = body.payload.payment.entity;
        // console.log(entity);
        const orderId = entity.notes?.razorpay_order_id;

        paymentHistory.orderId = orderId;
        paymentHistory.entity = entity;

        const refundId = body?.payload?.refund?.entity?.id || '';

        // Find the order in DB
        const checkOrder: any = await Order.findOne({ order_id: orderId });

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
                    payload: body?.payload
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

                // Choose template based on create or update
                const headerPath = path.join(process.cwd(), 'src/app/api/admin/html-templates/emailHeader.html');
                const footerPath = path.join(process.cwd(), 'src/app/api/admin/html-templates/emailFooter.html');
                const header = fs.readFileSync(headerPath, 'utf8');
                const footer = fs.readFileSync(footerPath, 'utf8');

                try {
                    const updatedOrder = await Order.findOne({ order_id: orderId });
                    const user = await User.findOne({ _id: checkOrder.userId })
                    // console.log("$$$updatedOrder$$$$$$$$$$$$$$user$$", updatedOrder, user);
                    const amountValue = typeof entity.amount === 'number' ? entity.amount / 100 : 0;
                    const subject = `Order Placed Successfully – Order ${checkOrder.order_id}`;
                    let userName = 'Customer';
                    let userEmail = '';
                    let userPhone = '';
                    const orderData: any = updatedOrder || checkOrder;
                    const deliveredAddr: any = orderData.deliveredAddress || null;

                    const orderDateTime =  orderData.createdAt ? moment(orderData.createdAt).tz('Asia/Kolkata').format('MMM D, YYYY HH:mm z') : orderData.createdAt;

                    if (deliveredAddr) {
                        userName = deliveredAddr?.name || 'Customer';
                        userEmail = deliveredAddr?.email || '';
                        userPhone = deliveredAddr?.phone || '';
                    }

                    let deliveryAddressText = ''

                    if (deliveredAddr) {
                        deliveryAddressText = `${deliveredAddr.address.houseNumber}, ${deliveredAddr.address.locality}, ${deliveredAddr.address.landmark}, ${deliveredAddr.address.city}, ${deliveredAddr.address.state} - ${deliveredAddr.address.pinCode}`;
                    }

                    console.log('##########checkOrder.medicineQuantity#############', checkOrder.medicineQuantity);

                    const [checkMedicineId] = await Promise.all([
                        Medicine.find({ _id: { $in: checkOrder.medicineId.map((i: any) => i) } }).select('_id name coverImage images'),
                    ]);

                    console.log('##########checkMedicineId#############', checkMedicineId);

                    const acceptedNames = checkMedicineId.map((m: any) => {
                        const item = checkOrder.medicineQuantity.find((i: any) => i.medicineId.toString() === m._id.toString());
                        return {
                            ...m._doc,
                            quantity: item ? item.quantity : 0,
                            price: item ? item.price : 0,
                        };
                    });

                    console.log('##########acceptedNames#############', acceptedNames);

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

                    const html = `
${header}

<div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px 0;">
  <div style="max-width:700px;margin:0 auto;background:#ffffff;padding:25px;border:1px solid #e6e6e6;border-radius:8px;">

    <p>Hello ${checkOrder.deliveredAddress?.name || 'Customer'},</p>

    <p>
      Thank you for your order!<br/>
      Your order has been placed successfully and is being processed. ✅
    </p>

    <p>
      Our pharmacy team is reviewing your order. Once confirmed, your medicines
      will be packed and delivered soon.
    </p>

    <!-- Order Summary -->
    <h3 style="margin-top:25px;">Order Summary</h3>
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="padding:8px;border:1px solid #eee;font-weight:600;">Order ID</td>
        <td style="padding:8px;border:1px solid #eee;">#${checkOrder.order_id}</td>
      </tr>
      <tr>
        <td style="padding:8px;border:1px solid #eee;font-weight:600;">Order Status</td>
        <td style="padding:8px;border:1px solid #eee;">Order Placed</td>
      </tr>
      <tr>
        <td style="padding:8px;border:1px solid #eee;font-weight:600;">Expected Delivery</td>
        <td style="padding:8px;border:1px solid #eee;">
          ${new Date(checkOrder.expectedDeliveryDate).toDateString()}
        </td>
      </tr>
      <tr>
        <td style="padding:8px;border:1px solid #eee;font-weight:600;">Delivery Address</td>
        <td style="padding:8px;border:1px solid #eee;">${deliveryAddressText}</td>
      </tr>
    </table>

    <!-- Items -->
    <h3 style="margin-top:25px;">Items in Your Order</h3>
    ${itemsHtml}

    <!-- Payment Details -->
    <h3 style="margin-top:25px;">Payment Details</h3>
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="padding:8px;border:1px solid #eee;">Subtotal</td>
        <td style="padding:8px;border:1px solid #eee;">
          ₹${checkOrder.calculationData.priceTotalSumBeforeDiscount}
        </td>
      </tr>
      
      ${checkOrder.calculationData.deliveryFee > 0 ? `       <tr>
        <td style="padding:8px;border:1px solid #eee;">Delivery Charges</td>
        <td style="padding:8px;border:1px solid #eee;">
          ₹${checkOrder.calculationData.deliveryFee}
        </td>
      </tr>` : ``}

      
      ${checkOrder.discount > 0 ? ` <tr>
        <td style="padding:8px;border:1px solid #eee;">Discount</td>
        <td style="padding:8px;border:1px solid #eee;">
          ₹${checkOrder.discount}
        </td>
      </tr>` : ``}

      <tr>
        <td style="padding:8px;border:1px solid #eee;font-weight:600;">
          Total Amount Paid
        </td>
        <td style="padding:8px;border:1px solid #eee;font-weight:600;">
          ₹${checkOrder.total_order_amount}
        </td>
      </tr>
      <tr>
        <td style="padding:8px;border:1px solid #eee;">Payment Method</td>
        <td style="padding:8px;border:1px solid #eee;">
          ${checkOrder.payment_mode.toUpperCase()}
        </td>
      </tr>
    </table>

    <p style="margin-top:25px;">
      You can track your order anytime from the <strong>My Orders</strong>
      section in the Pharmato app or website.
    </p>

    <p>
      Thank you for choosing Pharmato. We’re committed to delivering your
      medicines safely and on time.
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

                    let notificationUserId = '';
                    if (updatedOrder && typeof updatedOrder === 'object' && !Array.isArray(updatedOrder) && 'userId' in updatedOrder) {
                        notificationUserId = (updatedOrder as any).userId?.toString() || '';
                    }
                    await Notification.create({
                        userId: notificationUserId,
                        role: 'customer',
                        title: 'Order Placed',
                        message: checkOrder.isPrescriptionRequired !== true ? `Order Placed : Your Order has been placed successfully. Waiting for confirmation.` : `Order Placed : Your Order has been placed successfully. We will Notify you when your prescription is approved.`,
                        type: 'payment',
                        targetScreen: 'orders/detail',
                        targetId: checkOrder._id.toString(),
                        meta: {
                            paymentId: entity.id,
                            amount: `${amountValue}`,
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
                                body: `Your Order has been placed successfully.`,
                                data: {
                                    targetId: checkOrder._id.toString(),
                                    orderId: checkOrder._id.toString(),
                                    type: 'order_placed',
                                    targetScreen: 'orders/detail',
                                    paymentId: entity.id,
                                    amount: `${amountValue}`,
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
                    let adminEmail = '';
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
                                        adminEmail = (admin as any).email || '';
                                        // Try to get admin's role name
                                        if ('roleId' in admin && admin.roleId) {
                                            const roleDoc = await (await import('@/models/Role')).default.findById(admin.roleId).lean();
                                            if (roleDoc && typeof roleDoc === 'object' && !Array.isArray(roleDoc)) {
                                                adminRoleName = (roleDoc as any).name || '';
                                            }
                                        }

                                        const notificationMessage = checkOrder.isPrescriptionRequired == true ? `Order Received: Order #${checkOrder.order_id} has been placed by ${customerName}. Please review and approve/reject the prescription.` : `Order Received: Order #${checkOrder.order_id} has been placed by ${customerName}. Please review and confirm the order.`;

                                        // Notify store admin
                                        await Notification.create({
                                            userId: (store as any).adminManagerId.toString(),
                                            role: 'admin',
                                            title: 'New Order Received',
                                            message: notificationMessage,
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

                                        // Send email to adminEmail
                                        if (adminEmail) {
                                            const adminHtml = `
                                            ${header}

                                            <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px 0;">
  <div style="max-width:700px;margin:0 auto;background:#ffffff;padding:25px;border:1px solid #e6e6e6;border-radius:8px;">

    <p>Hello ${adminName || 'Store Manager'},</p>

    <p>
      A new order has been placed and requires your review. 📦
    </p>

    <!-- Order Details -->
    <h3 style="margin-top:25px;">Order Details</h3>
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="padding:8px;border:1px solid #eee;font-weight:600;">Order ID</td>
        <td style="padding:8px;border:1px solid #eee;">#${checkOrder.order_id}</td>
      </tr>
      <tr>
        <td style="padding:8px;border:1px solid #eee;font-weight:600;">Order Status</td>
        <td style="padding:8px;border:1px solid #eee;">Order Placed</td>
      </tr>
      <tr>
        <td style="padding:8px;border:1px solid #eee;font-weight:600;">Order Date & Time</td>
        <td style="padding:8px;border:1px solid #eee;">
          ${new Date(checkOrder.createdAt).toLocaleString()}
        </td>
      </tr>
    </table>

    <!-- Customer Details -->
    <h3 style="margin-top:25px;">Customer Details</h3>
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="padding:8px;border:1px solid #eee;">Customer Name</td>
        <td style="padding:8px;border:1px solid #eee;">
          ${checkOrder.deliveredAddress?.name}
        </td>
      </tr>
      <tr>
        <td style="padding:8px;border:1px solid #eee;">Mobile Number</td>
        <td style="padding:8px;border:1px solid #eee;">
          ${checkOrder.deliveredAddress?.mobileNumber}
        </td>
      </tr>
      <tr>
        <td style="padding:8px;border:1px solid #eee;">Email ID</td>
        <td style="padding:8px;border:1px solid #eee;">
          ${checkOrder.userEmail}
        </td>
      </tr>
      <tr>
        <td style="padding:8px;border:1px solid #eee;">Delivery Address</td>
        <td style="padding:8px;border:1px solid #eee;">
          ${deliveryAddressText}
        </td>
      </tr>
    </table>

    <!-- Items -->
    <h3 style="margin-top:25px;">Items in Order</h3>
    ${itemsHtml}

    <!-- Payment Details -->
    <h3 style="margin-top:25px;">Payment Details</h3>
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="padding:8px;border:1px solid #eee;">Subtotal</td>
        <td style="padding:8px;border:1px solid #eee;">
          ₹${checkOrder.calculationData.priceTotalSumBeforeDiscount}
        </td>
      </tr>
      
      ${checkOrder.calculationData.deliveryFee > 0 ? `       <tr>
        <td style="padding:8px;border:1px solid #eee;">Delivery Charges</td>
        <td style="padding:8px;border:1px solid #eee;">
          ₹${checkOrder.calculationData.deliveryFee}
        </td>
      </tr>` : ``}

      
      ${checkOrder.discount > 0 ? ` <tr>
        <td style="padding:8px;border:1px solid #eee;">Discount</td>
        <td style="padding:8px;border:1px solid #eee;">
          ₹${checkOrder.discount}
        </td>
      </tr>` : ``}

      <tr>
        <td style="padding:8px;border:1px solid #eee;font-weight:600;">
          Total Paid
        </td>
        <td style="padding:8px;border:1px solid #eee;font-weight:600;">
          ₹${checkOrder.total_order_amount}
        </td>
      </tr>
      <tr>
        <td style="padding:8px;border:1px solid #eee;">Payment Method</td>
        <td style="padding:8px;border:1px solid #eee;">
          ${checkOrder.payment_mode.toUpperCase()}
        </td>
      </tr>
    </table>

    <!-- Action Required -->
    <h3 style="margin-top:25px;color:#d9534f;">Action Required</h3>
    <ul style="padding-left:18px;">
      <li>Verify prescription uploaded by customer (If applicable)</li>
      <li>Validate medicine availability</li>
      <li>Proceed to confirm order</li>
    </ul>

    <p style="margin-top:20px;">
      You can review and process this order from the <strong>Admin Portal</strong>.
    </p>

    <p>
      Timely validation ensures faster delivery and better patient care.
    </p>

    <p style="margin-top:25px;">
      Regards,<br/>
      <strong>Team Pharmato</strong>
    </p>

  </div>
</div>
                                                   
                                                ${footer}
                                            `;
                                            await sendEmail({ to: adminEmail, subject: `New Order Received- ${checkOrder.order_id}`, html: adminHtml });
                                        }

                                        try {
                                            const adminToken = (admin as any).deviceToken;
                                            if (adminToken) {
                                                await sendPushNotificationWithData({
                                                    token: adminToken,
                                                    title: 'Pharmato',
                                                    body: notificationMessage,
                                                    data: {
                                                        targetId: checkOrder._id.toString(),
                                                        orderId: checkOrder._id.toString(),
                                                        type: 'order_placed',
                                                        targetScreen: 'orders/detail',
                                                        paymentId: entity.id,
                                                        amount: `${amountValue}`,
                                                        currency: entity.currency,
                                                        method: entity.method,
                                                        status: entity.status
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

                                const notificationMessage = checkOrder.isPrescriptionRequired == true ? `Order Received: ${customerName} has placed order #${checkOrder.order_id} with prescription uploaded at ${storeName}. Awaiting prescription review.` : `Order Received: ${customerName} has placed order #${checkOrder.order_id} at ${storeName}. Awaiting store confirmation.`;

                                // User {User Name} has placed order #{OrderID} at store {Store Name}. Waiting for store Manager to accept order.
                                await Notification.create({
                                    userId: (superAdmin as any)._id.toString(),
                                    role: 'admin',
                                    title: 'New Order Received',
                                    message: notificationMessage,
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

                                // Send email to super admin
                                const superAdminEmail = (superAdmin as any).email;
                                if (superAdminEmail) {
                                    const superAdminHtml = `${header}

                                    <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px 0;">
  <div style="max-width:700px;margin:0 auto;background:#ffffff;padding:25px;border:1px solid #e6e6e6;border-radius:8px;">

    <p>Hello Super Admin,</p>

    <p>
      A new order has been received at the following store. 📦
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
        <td style="padding:8px;border:1px solid #eee;">#${checkOrder.order_id}</td>
      </tr>
      <tr>
        <td style="padding:8px;border:1px solid #eee;font-weight:600;">Order Date & Time</td>
        <td style="padding:8px;border:1px solid #eee;">
          ${new Date(checkOrder.createdAt).toLocaleString()}
        </td>
      </tr>
      <tr>
        <td style="padding:8px;border:1px solid #eee;font-weight:600;">Order Status</td>
        <td style="padding:8px;border:1px solid #eee;">Order Placed</td>
      </tr>
    </table>

    <!-- Customer Details -->
    <h3 style="margin-top:25px;">Customer Details</h3>
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="padding:8px;border:1px solid #eee;">Customer Name</td>
        <td style="padding:8px;border:1px solid #eee;">
          ${checkOrder.deliveredAddress?.name}
        </td>
      </tr>
      <tr>
        <td style="padding:8px;border:1px solid #eee;">Mobile Number</td>
        <td style="padding:8px;border:1px solid #eee;">
          ${checkOrder.deliveredAddress?.mobileNumber}
        </td>
      </tr>
      <tr>
        <td style="padding:8px;border:1px solid #eee;">Email ID</td>
        <td style="padding:8px;border:1px solid #eee;">
          ${checkOrder.userEmail}
        </td>
      </tr>
      <tr>
        <td style="padding:8px;border:1px solid #eee;">Delivery Address</td>
        <td style="padding:8px;border:1px solid #eee;">
          ${deliveryAddressText}
        </td>
      </tr>
    </table>

    <!-- Items Ordered -->
    <h3 style="margin-top:25px;">Items Ordered</h3>
    ${itemsHtml}

    <!-- Payment Details -->
    <h3 style="margin-top:25px;">Payment Details</h3>
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="padding:8px;border:1px solid #eee;">Subtotal</td>
        <td style="padding:8px;border:1px solid #eee;">
          ₹${checkOrder.calculationData.priceTotalSumBeforeDiscount}
        </td>
      </tr>
      
      ${checkOrder.calculationData.deliveryFee > 0 ? `       <tr>
        <td style="padding:8px;border:1px solid #eee;">Delivery Charges</td>
        <td style="padding:8px;border:1px solid #eee;">
          ₹${checkOrder.calculationData.deliveryFee}
        </td>
      </tr>` : ``}

      
      ${checkOrder.discount > 0 ? ` <tr>
        <td style="padding:8px;border:1px solid #eee;">Discount</td>
        <td style="padding:8px;border:1px solid #eee;">
          ₹${checkOrder.discount}
        </td>
      </tr>` : ``}
      
      <tr>
        <td style="padding:8px;border:1px solid #eee;font-weight:600;">
          Total Paid
        </td>
        <td style="padding:8px;border:1px solid #eee;font-weight:600;">
          ₹${checkOrder.total_order_amount}
        </td>
      </tr>
      <tr>
        <td style="padding:8px;border:1px solid #eee;">Payment Method</td>
        <td style="padding:8px;border:1px solid #eee;">
          ${checkOrder.payment_mode.toUpperCase()}
        </td>
      </tr>
    </table>

    <p style="margin-top:25px;">
      This email is shared for centralized order tracking.
    </p>

    <p style="margin-top:20px;">
      Regards,<br/>
      <strong>Team Pharmato</strong>
    </p>

  </div>
</div>
        
                                        ${footer}
                                    `;
                                    await sendEmail({ to: superAdminEmail, subject: `New Order Received at ${storeName}`, html: superAdminHtml });
                                }

                                try {
                                    const superToken = (superAdmin as any).deviceToken;
                                    if (superToken) {
                                        await sendPushNotificationWithData({
                                            token: superToken,
                                            title: 'Pharmato',
                                            body: notificationMessage,
                                            data: {
                                                targetId: checkOrder._id.toString(),
                                                orderId: checkOrder._id.toString(),
                                                type: 'order_placed',
                                                targetScreen: 'orders/detail',
                                                paymentId: entity.id,
                                                amount: `${amountValue}`,
                                                currency: entity.currency,
                                                method: entity.method,
                                                status: entity.status
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
                            order_status: 'Cancelled'
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

            if (body.event == 'refund.processed') {

                await Order.updateOne(
                    { _id: checkOrder._id },
                    {
                        $set: { refundHistory: refundHistory }
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

                let userName = 'Customer';

                const updatedOrder = await Order.findOne({ order_id: orderId });
                const user = await User.findOne({ _id: checkOrder.userId })
                const amountValue = (body?.payload?.refund?.entity?.amount_refunded || 0) / 100;

                userName = updatedOrder?.deliveredAddress?.name || userName;

                let notificationUserId = '';
                if (updatedOrder && typeof updatedOrder === 'object' && !Array.isArray(updatedOrder) && 'userId' in updatedOrder) {
                    notificationUserId = (updatedOrder as any).userId?.toString() || '';
                }

                await Notification.create({
                    userId: notificationUserId,
                    role: 'customer',
                    title: 'Refund Processed',
                    message: `Refund Successful : Refund of ₹${amountValue} has been credited to your original Payment Method.`,
                    type: 'refund_processed',
                    targetScreen: 'orders/detail',
                    targetId: checkOrder._id.toString(),
                    meta: {
                        amount: `${amountValue}`,
                    }
                });

                // Send push notification to customer if deviceToken exists
                if (user && (user as any).deviceToken) {
                    try {
                        await sendPushNotificationWithData({
                            token: (user as any).deviceToken,
                            title: 'Pharmato',
                            body: `Refund credited Successfully.`,
                            data: {
                                targetId: checkOrder._id.toString(),
                                orderId: checkOrder._id.toString(),
                                type: 'refund_processed',
                                targetScreen: 'orders/detail',
                                amount: `${amountValue}`
                            }
                        });
                    } catch (err) {
                        console.error('Failed to send push notification:', err);
                    }
                }

                // Notify admin (store manager) and superadmins with detailed message
                if (updatedOrder.storeId) {
                    const storeId = (updatedOrder as any).storeId;
                    if (storeId) {
                        const store = await Store.findById(storeId).lean();
                        if (store && typeof store === 'object' && !Array.isArray(store)) {
                            // storeName = (store as any).name || '';
                            if ('adminManagerId' in store && store.adminManagerId) {
                                const admin = await Admin.findById((store as any).adminManagerId).lean();
                                if (admin && typeof admin === 'object' && !Array.isArray(admin)) {

                                    let storeNotMsg: any = `Refund Processed: Refund of ₹${amountValue} for Order #${updatedOrder.order_id} has been processed successfully.`;

                                    // Notify store admin
                                    await Notification.create({
                                        userId: (store as any).adminManagerId.toString(),
                                        role: 'admin',
                                        title: 'Refund Processed',
                                        message: storeNotMsg,
                                        type: 'order',
                                        targetScreen: 'orders/detail',
                                        targetId: updatedOrder._id.toString(),
                                        meta: {}
                                    });

                                    try {
                                        const adminToken = (admin as any).deviceToken;
                                        if (adminToken) {
                                            await sendPushNotificationWithData({
                                                token: adminToken,
                                                title: 'Pharmato',
                                                body: storeNotMsg,
                                                data: {
                                                    targetId: updatedOrder._id.toString(),
                                                    orderId: updatedOrder._id.toString(),
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
                                title: 'Refund Processed',
                                message: `Refund Processed: Refund of ₹${amountValue || 0} for order #${updatedOrder.order_id || updatedOrder._id} has been successfully processed for ${userName}.`,
                                type: 'order',
                                targetScreen: 'orders/detail',
                                targetId: updatedOrder._id.toString(),
                                meta: {
                                    orderId: updatedOrder._id.toString(),
                                }
                            });

                            try {
                                const superToken = (superAdmin as any).deviceToken;
                                if (superToken) {
                                    await sendPushNotificationWithData({
                                        token: superToken,
                                        title: 'Pharmato',
                                        body: `Refund Processed: Refund of ₹${amountValue || 0} for order #${updatedOrder.order_id || updatedOrder._id} has been successfully processed for ${userName}.`,
                                        data: {
                                            targetId: updatedOrder._id.toString(),
                                            orderId: updatedOrder._id.toString(),
                                            type: 'order_refunded',
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

            }

            if (body.event == 'refund.failed') {

                await Order.updateOne(
                    { _id: checkOrder._id },
                    {
                        $set: { refundHistory: refundHistory }
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

            if (body.event == 'refund.speed_changed') {

                await Order.updateOne(
                    { _id: checkOrder._id },
                    {
                        $set: { refundHistory: refundHistory }
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

        }
    }

}

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
