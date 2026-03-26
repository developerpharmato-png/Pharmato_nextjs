import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Order from '@/models/Order';
import UserAddress from '@/models/UserAddress';
import Store from '@/models/Store';
import Medicine from '@/models/Medicine';
import mongoose from 'mongoose';
import Wallet from '@/models/Wallet';
import { getDb, sendPushNotificationWithData } from '@/utils/firebase.helper';
import Cart from '@/models/Cart';
import Setting from '@/models/Setting';
import { sendEmail } from '@/utils/sendEmail';
import Admin from '@/models/Admin';
import Razorpay from 'razorpay';
import fs from 'fs';
import path from 'path';
import moment from 'moment-timezone';
import Notification from '@/models/Notification';
import Coupon from '@/models/Coupon';

function calculateDeliveryFee(
  orderAmount: number,
  deliveryFeeThreshold: number,
  deliveryFee: number
): number {
  if (orderAmount >= deliveryFeeThreshold) {
    return 0;
  }
  return deliveryFee;
}

function getActiveSurge(surgePricing: any[]) {
  const now = new Date();

  // Convert to IST explicitly
  const istTime = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );

  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const currentDay = days[istTime.getDay()];

  const hours = istTime.getHours().toString().padStart(2, "0");
  const minutes = istTime.getMinutes().toString().padStart(2, "0");
  const currentTime = `${hours}:${minutes}`;

  console.log("IST Day:", currentDay);
  console.log("IST Time:", currentTime);

  const activeSurge = surgePricing.find((item) => {
    return (
      item.day === currentDay &&
      item.status === true &&
      currentTime >= item.startTime &&
      currentTime <= item.endTime
    );
  });

  return activeSurge || null;
}

/**
 * @swagger
 * /api/customer/order/create:
 *   post:
 *     summary: Create a new customer order
 *     description: Creates an order for the customer using calculation data from cart-calculation API.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - storeId
 *               - calculationData
 *               - addressId
 *               - isPaymentByWallet
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User's ObjectId
 *               storeId:
 *                 type: string
 *                 description: Store's ObjectId for the order
 *               calculationData:
 *                 type: object
 *                 description: Calculation data from cart-calculation API
 *               addressId:
 *                 type: string
 *                 description: User address ObjectId to be used for this order
 *               isPrescriptionRequired:
 *                 type: boolean
 *                 description: Whether a prescription is required for this order
 *               prescription_url:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of prescription image/pdf URLs
 *               isPaymentByWallet:
 *                 type: boolean
 *                 description: Whether payment is by wallet
 *     responses:
 *       200:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     order_id_fk:
 *                       type: string
 *                     orderID:
 *                       type: string
 *                     isPaymentTake:
 *                       type: boolean
 *                     razorPayKeyId:
 *                       type: string
 *                     razorPaySecretKey:
 *                       type: string
 *       400:
 *         description: Missing or invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: User not found
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


async function runBackground(orderId: any,) {

  // Choose template based on create or update
  const headerPath = path.join(process.cwd(), 'src/app/api/admin/html-templates/emailHeader.html');
  const footerPath = path.join(process.cwd(), 'src/app/api/admin/html-templates/emailFooter.html');
  const header = fs.readFileSync(headerPath, 'utf8');
  const footer = fs.readFileSync(footerPath, 'utf8');

  try {
    const orderData: any = await Order.findOne({ order_id: orderId });
    const user = await User.findOne({ _id: orderData.userId })
    // console.log("$$$updatedOrder$$$$$$$$$$$$$$user$$", updatedOrder, user);
    const amountValue = orderData.total_order_amount
    const subject = `Order Placed Successfully`;
    let userName = 'Customer';
    let userEmail = '';
    let userPhone = '';
    const deliveredAddr: any = orderData.deliveredAddress || null;

    const orderDateTime = orderData.createdAt ? moment(orderData.createdAt).tz('Asia/Kolkata').format('MMM D, YYYY HH:mm z') : orderData.createdAt;

    if (deliveredAddr) {
      userName = deliveredAddr?.name || 'Customer';
      userEmail = deliveredAddr?.email || '';
      userPhone = deliveredAddr?.phone || '';
    }

    let deliveryAddressText = ''

    if (deliveredAddr) {
      deliveryAddressText = [
        deliveredAddr.address?.houseNumber,
        deliveredAddr.address?.locality,
        deliveredAddr.address?.landmark,
        deliveredAddr.address?.city,
        deliveredAddr.address?.state,
        deliveredAddr.address?.pinCode ? `- ${deliveredAddr.address.pinCode}` : null
      ]
        .filter(Boolean)
        .join(', ');
    }

    console.log('##########orderData.medicineQuantity#############', orderData.medicineQuantity);

    const [checkMedicineId] = await Promise.all([
      Medicine.find({ _id: { $in: orderData.medicineId.map((i: any) => i) } }).select('_id name coverImage images'),
    ]);

    console.log('##########checkMedicineId#############', checkMedicineId);

    const acceptedNames = checkMedicineId.map((m: any) => {
      const item = orderData.medicineQuantity.find((i: any) => i.medicineId.toString() === m._id.toString());
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
    
        <p>Hello ${orderData.deliveredAddress?.name || 'Customer'},</p>
    
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
            <td style="padding:8px;border:1px solid #eee;">#${orderData.order_id}</td>
          </tr>
          <tr>
            <td style="padding:8px;border:1px solid #eee;font-weight:600;">Order Status</td>
            <td style="padding:8px;border:1px solid #eee;">Order Placed</td>
          </tr>
          <tr>
            <td style="padding:8px;border:1px solid #eee;font-weight:600;">Expected Delivery</td>
            <td style="padding:8px;border:1px solid #eee;">
              ${new Date(orderData.expectedDeliveryDate).toDateString()}
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
              ₹${orderData.calculationData.priceTotalSumBeforeDiscount}
            </td>
          </tr>
          
          ${orderData.calculationData.deliveryFee > 0 ? `       <tr>
            <td style="padding:8px;border:1px solid #eee;">Delivery Charges</td>
            <td style="padding:8px;border:1px solid #eee;">
              ₹${orderData.calculationData.deliveryFee}
            </td>
          </tr>` : ``}
    
          
          ${orderData.discount > 0 ? ` <tr>
            <td style="padding:8px;border:1px solid #eee;">Discount</td>
            <td style="padding:8px;border:1px solid #eee;">
              ₹${orderData.discount}
            </td>
          </tr>` : ``}
    
          <tr>
            <td style="padding:8px;border:1px solid #eee;font-weight:600;">
              Total Amount Paid
            </td>
            <td style="padding:8px;border:1px solid #eee;font-weight:600;">
              ₹${orderData.total_order_amount}
            </td>
          </tr>
          <tr>
            <td style="padding:8px;border:1px solid #eee;">Payment Method</td>
            <td style="padding:8px;border:1px solid #eee;">
              ${orderData.payment_mode.toUpperCase()}
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
    if (orderData && typeof orderData === 'object' && !Array.isArray(orderData) && 'userId' in orderData) {
      notificationUserId = (orderData as any).userId?.toString() || '';
    }
    await Notification.create({
      userId: notificationUserId,
      role: 'customer',
      title: 'Order Placed',
      message: orderData.isPrescriptionRequired !== true ? `Your Order has been placed successfully. Waiting for confirmation.` : `Your Order has been placed successfully. We will Notify you when your prescription is approved.`,
      type: 'payment',
      targetScreen: 'orders/detail',
      targetId: orderData._id.toString(),
      meta: {}
    });

    // Send push notification to customer if deviceToken exists
    if (user && (user as any).deviceToken) {
      try {
        await sendPushNotificationWithData({
          token: (user as any).deviceToken,
          title: 'Order Placed',
          body: `Your Order has been placed successfully.`,
          data: {
            targetId: orderData._id.toString(),
            orderId: orderData._id.toString(),
            type: 'order_placed',
            targetScreen: 'orders/detail',
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
    if (orderData && typeof orderData === 'object' && !Array.isArray(orderData) && 'storeId' in orderData) {
      const storeId = (orderData as any).storeId;
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

              const notificationMessage = orderData.isPrescriptionRequired == true ? `Order #${orderData.order_id} has been placed by ${customerName}. Please review and approve/reject the prescription.` : `Order #${orderData.order_id} has been placed by ${customerName}. Please review and confirm the order.`;

              // Notify store admin
              await Notification.create({
                userId: (store as any).adminManagerId.toString(),
                role: 'admin',
                title: 'Order Received',
                message: notificationMessage,
                type: 'order',
                targetScreen: 'orders/detail',
                targetId: orderData._id.toString(),
                meta: {}
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
            <td style="padding:8px;border:1px solid #eee;">#${orderData.order_id}</td>
          </tr>
          <tr>
            <td style="padding:8px;border:1px solid #eee;font-weight:600;">Order Status</td>
            <td style="padding:8px;border:1px solid #eee;">Order Placed</td>
          </tr>
          <tr>
            <td style="padding:8px;border:1px solid #eee;font-weight:600;">Order Date & Time</td>
            <td style="padding:8px;border:1px solid #eee;">
              ${new Date(orderData.createdAt).toLocaleString()}
            </td>
          </tr>
        </table>
    
        <!-- Customer Details -->
        <h3 style="margin-top:25px;">Customer Details</h3>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:8px;border:1px solid #eee;">Customer Name</td>
            <td style="padding:8px;border:1px solid #eee;">
              ${orderData.deliveredAddress?.name}
            </td>
          </tr>
          <tr>
            <td style="padding:8px;border:1px solid #eee;">Mobile Number</td>
            <td style="padding:8px;border:1px solid #eee;">
              ${orderData.deliveredAddress?.phone}
            </td>
          </tr>
          <tr>
            <td style="padding:8px;border:1px solid #eee;">Email ID</td>
            <td style="padding:8px;border:1px solid #eee;">
              ${orderData.deliveredAddress?.email}
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
              ₹${orderData.calculationData.priceTotalSumBeforeDiscount}
            </td>
          </tr>
          
          ${orderData.calculationData.deliveryFee > 0 ? `       <tr>
            <td style="padding:8px;border:1px solid #eee;">Delivery Charges</td>
            <td style="padding:8px;border:1px solid #eee;">
              ₹${orderData.calculationData.deliveryFee}
            </td>
          </tr>` : ``}
    
          
          ${orderData.discount > 0 ? ` <tr>
            <td style="padding:8px;border:1px solid #eee;">Discount</td>
            <td style="padding:8px;border:1px solid #eee;">
              ₹${orderData.discount}
            </td>
          </tr>` : ``}
    
          <tr>
            <td style="padding:8px;border:1px solid #eee;font-weight:600;">
              Total Paid
            </td>
            <td style="padding:8px;border:1px solid #eee;font-weight:600;">
              ₹${orderData.total_order_amount}
            </td>
          </tr>
          <tr>
            <td style="padding:8px;border:1px solid #eee;">Payment Method</td>
            <td style="padding:8px;border:1px solid #eee;">
              ${orderData.payment_mode.toUpperCase()}
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
                await sendEmail({ to: adminEmail, subject: `New Order Received – Review & Process`, html: adminHtml });
              }

              try {
                const adminToken = (admin as any).deviceToken;
                if (adminToken) {
                  await sendPushNotificationWithData({
                    token: adminToken,
                    title: 'Order Received',
                    body: notificationMessage,
                    data: {
                      targetId: orderData._id.toString(),
                      orderId: orderData._id.toString(),
                      type: 'order_placed',
                      targetScreen: 'orders/detail',
                      amount: `${amountValue}`
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

          const notificationMessage = orderData.isPrescriptionRequired == true ? `${customerName} has placed order #${orderData.order_id} with prescription uploaded at ${storeName}. Awaiting prescription review.` : `${customerName} has placed order #${orderData.order_id} at ${storeName}. Awaiting store confirmation.`;

          // User {User Name} has placed order #{OrderID} at store {Store Name}. Waiting for store Manager to accept order.
          await Notification.create({
            userId: (superAdmin as any)._id.toString(),
            role: 'admin',
            title: 'Order Received',
            message: notificationMessage,
            type: 'order',
            targetScreen: 'orders/detail',
            targetId: orderData._id.toString(),
            meta: {}
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
            <td style="padding:8px;border:1px solid #eee;">#${orderData.order_id}</td>
          </tr>
          <tr>
            <td style="padding:8px;border:1px solid #eee;font-weight:600;">Order Date & Time</td>
            <td style="padding:8px;border:1px solid #eee;">
              ${new Date(orderData.createdAt).toLocaleString()}
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
              ${orderData.deliveredAddress?.name}
            </td>
          </tr>
          <tr>
            <td style="padding:8px;border:1px solid #eee;">Mobile Number</td>
            <td style="padding:8px;border:1px solid #eee;">
               ${orderData.deliveredAddress?.phone}
            </td>
          </tr>
          <tr>
            <td style="padding:8px;border:1px solid #eee;">Email ID</td>
            <td style="padding:8px;border:1px solid #eee;">
              ${orderData.deliveredAddress?.email}
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
              ₹${orderData.calculationData.priceTotalSumBeforeDiscount}
            </td>
          </tr>
          
          ${orderData.calculationData.deliveryFee > 0 ? `       <tr>
            <td style="padding:8px;border:1px solid #eee;">Delivery Charges</td>
            <td style="padding:8px;border:1px solid #eee;">
              ₹${orderData.calculationData.deliveryFee}
            </td>
          </tr>` : ``}
    
          
          ${orderData.discount > 0 ? ` <tr>
            <td style="padding:8px;border:1px solid #eee;">Discount</td>
            <td style="padding:8px;border:1px solid #eee;">
              ₹${orderData.discount}
            </td>
          </tr>` : ``}
          
          <tr>
            <td style="padding:8px;border:1px solid #eee;font-weight:600;">
              Total Paid
            </td>
            <td style="padding:8px;border:1px solid #eee;font-weight:600;">
              ₹${orderData.total_order_amount}
            </td>
          </tr>
          <tr>
            <td style="padding:8px;border:1px solid #eee;">Payment Method</td>
            <td style="padding:8px;border:1px solid #eee;">
              ${orderData.payment_mode.toUpperCase()}
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
                title: 'Order Received',
                body: notificationMessage,
                data: {
                  targetId: orderData._id.toString(),
                  orderId: orderData._id.toString(),
                  type: 'order_placed',
                  targetScreen: 'orders/detail',
                  amount: `${amountValue}`
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


export async function POST(req: NextRequest) {
  await dbConnect();
  const { userId, storeId, calculationData, addressId, isPrescriptionRequired, prescription_url, isPaymentByWallet } = await req.json();

  if (typeof isPaymentByWallet !== 'boolean') {
    return NextResponse.json({ success: false, message: 'isPaymentByWallet is required and must be boolean' }, { status: 400 });
  }

  // Normalize prescription_url to array of strings
  let prescriptionUrlArr: string[] = [];
  if (Array.isArray(prescription_url)) {
    prescriptionUrlArr = prescription_url.filter(url => typeof url === 'string');
  } else if (typeof prescription_url === 'string' && prescription_url) {
    prescriptionUrlArr = [prescription_url];
  }
  if (!userId || typeof userId !== 'string') {
    return NextResponse.json({ success: false, message: 'userId is required' }, { status: 400 });
  }
  if (!storeId || typeof storeId !== 'string' || storeId.trim() === '') {
    return NextResponse.json({ success: false, message: 'storeId is required' }, { status: 400 });
  }
  if (!calculationData || typeof calculationData !== 'object') {
    return NextResponse.json({ success: false, message: 'calculationData is required' }, { status: 400 });
  }
  if (!addressId || typeof addressId !== 'string') {
    return NextResponse.json({ success: false, message: 'addressId is required' }, { status: 400 });
  }
  if (!mongoose.Types.ObjectId.isValid(addressId)) {
    return NextResponse.json({ success: false, message: 'Invalid addressId' }, { status: 400 });
  }
  const userCheck = await User.findOne({ _id: new mongoose.Types.ObjectId(userId) });
  if (!userCheck) {
    return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
  }

  // Get settings
  const settings = await Setting.find().lean();
  let deliveryFee = 0;
  let deliveryFeeThreshold: any = "";
  let privacyPolicy: any = "";
  let termAndCondition: any = "";
  let surgePricing: any = [];
  let returnAndRefundPolicy: any = "";
  let otherPolicy: any = "";

  for (const setting of settings) {
    if (setting.type === 'deliveryFee') deliveryFee = Number(setting.data);
    if (setting.type === 'deliveryFeeThreshold') deliveryFeeThreshold = setting.data;
    if (setting.type === 'userPrivacyPolicy') privacyPolicy = setting.data;
    if (setting.type === 'userTerm&Condition') termAndCondition = setting.data;
    if (setting.type === 'return&RefundPolicy') returnAndRefundPolicy = setting.data;
    if (setting.type === 'otherPolicy') otherPolicy = setting.data;
    if (setting.type === 'surgePricing') surgePricing = setting?.extraData || [];
  }

  const surge = getActiveSurge(surgePricing);

  if (surge) {
    console.log("Surge Active:", surge);
    deliveryFee = Number(deliveryFee) + Number(surge.surgeFee);
  } else {
    console.log("No Surge Now");
  }

  if (deliveryFeeThreshold && deliveryFeeThreshold !== "") {
    deliveryFee = calculateDeliveryFee(
      calculationData.priceTotalSumAfterDiscount,
      deliveryFeeThreshold,
      deliveryFee
    );
  }

  // Validate delivery fee
  if (deliveryFee !== Number(calculationData.deliveryFee)) {

    return NextResponse.json({ success: false, message: 'Delivery fee changed. Refresh your cart to continue.' }, { status: 400 });

  }

  // Fetch address and log it
  const addressDoc = await UserAddress.findById(addressId);
  if (!addressDoc) {
    return NextResponse.json({ success: false, message: 'Address not found' }, { status: 404 });
  }
  // console.log('Order address:', addressDoc);
  // Prepare medicineId array
  const medicineId = (calculationData.medicineId || []).map((id: string) => new mongoose.Types.ObjectId(id));

  // // Generate unique order and payment IDs
  // const now = new Date();
  // const uniqueNumber = now.getFullYear().toString() +
  //     (now.getMonth() + 1).toString().padStart(2, '0') +
  //     now.getDate().toString().padStart(2, '0') +
  //     now.getHours().toString().padStart(2, '0') +
  //     now.getMinutes().toString().padStart(2, '0') +
  //     now.getSeconds().toString().padStart(2, '0') +
  //     now.getMilliseconds().toString().padStart(3, '0');
  // const orderID = `PH_ORD-${uniqueNumber}`;

  const now = new Date();
  const year = now.getFullYear().toString().slice(-2); // 26
  const month = (now.getMonth() + 1).toString();       // 3
  const day = now.getDate().toString();               // 2
  const shortDate = year + month + day; // 2632
  const timePart =
    now.getHours().toString().padStart(2, '0') +
    now.getMinutes().toString().padStart(2, '0') +
    now.getSeconds().toString().padStart(2, '0') +
    now.getMilliseconds().toString().padStart(3, '0');

  const uniqueNumber = shortDate + timePart; // 2632000000
  const orderID = `PH-${uniqueNumber}`; // PH-2632000000

  const paymentId = isPaymentByWallet ? `PAYID-WALLET-PMT-${uniqueNumber}M` : `PAYID-PMT-${uniqueNumber}M`;
  const discount = calculationData.discount || 0;
  const userTotalTaxCharged = calculationData.platformFee || 0;
  const totalOrderAmount = calculationData.totalOrderAmount || 0;
  const razorPayCommissionAmount = calculationData.razorPayCommissionAmount || 0;
  const razorPayCommissionGstAmount = calculationData.razorPayCommissionGstAmount || 0;
  const totalAmountRazorPayCharged = razorPayCommissionAmount + razorPayCommissionGstAmount;
  // Create order
  let storeObjectId: mongoose.Types.ObjectId | null = null;
  try {
    storeObjectId = new mongoose.Types.ObjectId(storeId.trim());
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid storeId' }, { status: 400 });
  }

  // Check if pinCode is available for the store
  // Type assertion to IStore to ensure correct property access
  const store = await Store.findOne({
    _id: storeObjectId,
    status: true
  }).lean() as import('@/models/Store').IStore | null;

  // console.log(store);

  if (!store || !Array.isArray(store.servicePinCodes) || !store.servicePinCodes.includes(addressDoc.address.pinCode)) {
    return NextResponse.json({ success: false, message: 'Oops! Currently We are unservicable in your area.' }, { status: 400 });
  }

  const cart = await Cart.findOne({ userId, storeId })

  if (cart?.items?.length > 0) {

    const calculationItems = calculationData.medicineQuantity;
    const cartItems = cart.items;

    // Loop over calculation medicines
    for (const calcItem of calculationItems) {

      const cartItem = cartItems.find(
        (item: any) => item.medicineId.toString() === calcItem.medicineId.toString()
      );

      // Agar cart me medicine hi nahi mili
      if (!cartItem) {
        return NextResponse.json({ success: false, message: 'Cart updated. Refresh your cart to continue.' }, { status: 400 });
      }

      // Agar quantity mismatch hai
      if (cartItem.quantity !== calcItem.quantity) {
        return NextResponse.json({ success: false, message: 'Cart updated. Refresh your cart to continue.' }, { status: 400 });
      }
    }

    // Loop over cart items
    for (const cartItem of cartItems) {

      const calcItem = calculationItems.find(
        (item: any) => item.medicineId.toString() === cartItem.medicineId.toString()
      );

      // Agar calculationData me medicine hi nahi mili
      if (!calcItem) {
        return NextResponse.json(
          { success: false, message: 'Cart updated. Refresh your cart to continue.' },
          { status: 400 }
        );
      }

      // Agar quantity mismatch hai
      if (cartItem.quantity !== calcItem.quantity) {
        return NextResponse.json(
          { success: false, message: 'Cart updated. Refresh your cart to continue.' },
          { status: 400 }
        );
      }
    }

  } else {
    return NextResponse.json({ success: false, message: 'Cart empty' }, { status: 400 });
  }

  // Logged-in user cart calculation
  const cartData = await Cart.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId), storeId: new mongoose.Types.ObjectId(storeId) } },
    { $unwind: '$items' },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'medicines',
        localField: 'items.medicineId',
        foreignField: '_id',
        as: 'medicine'
      }
    },
    { $unwind: { path: '$medicine', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        userId: '$user._id',
        medicine: 1,
        quantity: '$items.quantity',
      }
    }
  ]);

  const priceTotalSumBeforeDiscount = cartData.reduce((sum, item) => sum + (item.medicine.price * item.quantity), 0);

  if (Number(priceTotalSumBeforeDiscount.toFixed(2)) !== Number(calculationData?.priceTotalSumBeforeDiscount || 0)) {

    return NextResponse.json(
      { success: false, message: 'Cart updated. Refresh your cart to continue.' },
      { status: 400 }
    );

  }

  // Calculate expectedDeliveryDate (only date, no time)
  let expectedDeliveryDate = new Date(now);
  if (now.getHours() >= 22) {
    expectedDeliveryDate.setDate(now.getDate() + 1);
  }
  expectedDeliveryDate.setHours(0, 0, 0, 0); // Set to midnight, so only date part is used

  // Check if any medicine in cartData is inactive
  if (Array.isArray(cartData)) {
    const inactiveMed = cartData.find((item) => item.medicine && item.medicine.isActive === false);
    if (inactiveMed) {
      return NextResponse.json({ success: false, message: `One or more items in your cart are no longer available.` }, { status: 400 });
    }
  }

  // Check stock for each medicine in medicineQuantity
  if (Array.isArray(calculationData.medicineQuantity)) {
    for (const item of calculationData.medicineQuantity) {
      if (!item.medicineId || typeof item.quantity !== 'number') continue;
      const med = await Medicine.findById(item.medicineId).lean();
      // Type assertion to ensure med is not an array
      const medDoc = med as import('@/models/Medicine').IMedicine | null;
      if (!medDoc) {
        return NextResponse.json({ success: false, message: `Medicine not found: ${item.medicineId}` }, { status: 400 });
      }
      if (typeof medDoc.stock === 'number' && item.quantity > medDoc.stock) {
        return NextResponse.json({ success: false, message: `Stock not available for medicine: ${medDoc.name}` }, { status: 400 });
      }
    }
  }

  const createOrder = await Order.create({
    userId: userCheck._id,
    storeId: storeObjectId,
    medicineId,
    payment_mode: isPaymentByWallet ? 'Wallet' : 'online',
    total_order_amount: totalOrderAmount,
    actual_amount: calculationData.priceTotalSumBeforeDiscount || 0,
    user_total_tax_charged: userTotalTaxCharged,
    razorPay_total_tax_charged: totalAmountRazorPayCharged,
    platform_fee: calculationData.platformFee || 0,
    discount: discount,
    order_id: orderID,
    invoice_url: '',
    payment_id: paymentId,
    payment_status: isPaymentByWallet ? 'Deducted From Wallet' : 'Pending',
    is_order_rated: 0,
    order_status: isPaymentByWallet ? 'Order Placed' : 'Pending',
    medicineQuantity: calculationData.medicineQuantity || [],
    calculationData,
    paymentHistory: [{}],
    isPrescriptionRequired: isPrescriptionRequired || false,
    prescription_url: prescriptionUrlArr,
    prescription_status: isPrescriptionRequired ? 'Pending' : 'Not Required',
    deliveredAddress: addressDoc.toObject(),
    expectedDeliveryDate,
    privacyPolicy,
    termAndCondition,
    returnAndRefundPolicy,
    otherPolicy
  });

  if (isPaymentByWallet) {

    const userObjectId =
      typeof createOrder.userId === 'string'
        ? new mongoose.Types.ObjectId(createOrder.userId)
        : createOrder.userId;

    const walletDoc = await Wallet.create({
      userId: userCheck._id,
      payment_mode: 'Wallet',
      amount: totalOrderAmount || 0,
      totalAmount: totalOrderAmount || 0,
      razorPay_total_tax_charged: totalAmountRazorPayCharged || 0,
      recharge_id: '',
      payment_id: '',
      recharge_status: 'Success',
      payment_status: 'Credited',
      wallet_transaction_type: 'Paid to',
      transaction_to: `Pharmato`,
      paymentHistory: [],
    });

    await User.updateOne(
      { _id: userObjectId },
      { $inc: { walletAmount: -Number(totalOrderAmount || 0) } }
    );

    if (calculationData?.couponCode) {

      const code = calculationData.couponCode.trim().toUpperCase();

      // Try updating existing user usage
      const updatedCoupon = await Coupon.findOneAndUpdate(
        {
          code,
          "usersOrGuestsUsed.userId": userId
        },
        {
          $inc: {
            "usersOrGuestsUsed.$.uses": 1,
            usedCount: 1
          }
        },
        { new: true }
      );

      // If user not found → push new entry
      if (!updatedCoupon) {
        await Coupon.findOneAndUpdate(
          { code },
          {
            $push: {
              usersOrGuestsUsed: {
                userId: userId,
                guestId: '',
                uses: 1
              }
            },
            $inc: { usedCount: 1 }
          }
        );
      }

    }

    // Update paymentStatus in Firebase Realtime Database
    if (createOrder?.order_id) {
      const db = getDb();
      //Firebase realtime data update
      const firebaseRef = db.ref(`orders/${createOrder.order_id}`);
      const snapshot = await firebaseRef.once('value');
      const isOrderStatusChanged: any = Number(snapshot.val()?.isOrderStatusChanged || 0) + 1
      await firebaseRef.update({
        isOrderStatusChanged: isOrderStatusChanged,
        paymentStatus: createOrder.payment_status
      });
    }

    setImmediate(() => {
      runBackground(orderID);
    });

  }

  if (createOrder) {
    return NextResponse.json({
      success: true,
      message: 'Ordered successfully',
      data: {
        order_id_fk: createOrder.id,
        orderID: createOrder.order_id,
        isPaymentTake: isPaymentByWallet ? false : true,
        razorPayKeyId: process.env.razorPay_Key_Id || '',
        razorPaySecretKey: process.env.razorPay_Secret_Key || ''
      }
    });
  } else {
    return NextResponse.json({ success: false, message: 'Order not created' });
  }

}
