export const runtime = "nodejs";

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';
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
import Admin from '@/models/Admin';
import Store from '@/models/Store';
import moment from 'moment-timezone';
import { uploadToCloudinary } from '@/lib/cloudinaryUtils';
import puppeteer from "puppeteer";
import axios from "axios";
import crypto from 'crypto';
import zlib from "zlib";
// 🔥 Firebase update
const db = getDb();

const MARG_KEY = "48TPI07W1R2S";

export async function decryptMargData(data: string) {
    const buffer = Buffer.from(data, "base64");

    const result = zlib.inflateRawSync(buffer);

    // Buffer → string
    const text = result.toString("utf8");

    // Remove BOM
    const cleaned = text.replace(/^\uFEFF/, "");

    // Convert to JSON object
    return JSON.parse(cleaned);
}


const razorpayInstance = new Razorpay({
    key_id: process.env.razorPay_Key_Id || '',
    key_secret: process.env.razorPay_Secret_Key || ''
});

async function runBackground(order: any, user: any, unCancelledItems: any[], cancelReason: string) {

    let refundAmount = 0;
    let responseMessage = '';
    let userName = 'Customer';
    let userMobile = '';
    let userEmail = '';
    let deliveryAddressText = ''

    const deliveredAddr: any = order.deliveredAddress || null;
    if (deliveredAddr) {
        userName = deliveredAddr?.name || 'Customer';
        userMobile = deliveredAddr?.phone || '';
        userEmail = deliveredAddr?.email || '';
        deliveryAddressText = `${deliveredAddr.address.houseNumber}, ${deliveredAddr.address.locality}, ${deliveredAddr.address.landmark}, ${deliveredAddr.address.city}, ${deliveredAddr.address.state} - ${deliveredAddr.address.pinCode}`;
    }

    if (unCancelledItems.length == 0) {
        responseMessage = 'Order cancelled successfully.';
    }

    const store: any = await Store.findById(order.storeId).lean();
    const storeName = store ? (store.name || 'Store') : 'Store';

    // Choose template based on create or update
    const headerPath = path.join(process.cwd(), 'src/app/api/admin/html-templates/emailHeader.html');
    const footerPath = path.join(process.cwd(), 'src/app/api/admin/html-templates/emailFooter.html');
    const header = fs.readFileSync(headerPath, 'utf8');
    const footer = fs.readFileSync(footerPath, 'utf8');

    // console.log(order.medicineQuantity);

    // Use the same cancelledItems array for refund logic
    const cancelledForRefund = order.medicineQuantity.filter((item: any) => item.status === 'cancelled');

    if (cancelledForRefund.length == 0) {
        responseMessage = 'Order accepted successfully.';
    }

    if (cancelledForRefund.length > 0) {

        refundAmount = Number(cancelledForRefund.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0));

        if (unCancelledItems.length == 0) {
            refundAmount += Number(order.calculationData.deliveryFee || 0); // Add delivery fee back to refund if entire order is cancelled
        }

        if (order.payment_mode === 'Wallet') {

            await User.updateOne(
                { _id: new mongoose.Types.ObjectId(user._id) },
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


            try {
                const refundResponse = await razorpayInstance.payments.refund(order.payment_id, {
                    amount: refundAmount * 100
                });
            } catch (error) { }
            // console.log("$$$$$refundAmount$$$$$$", refundAmount);

        }
    }

    if (unCancelledItems.length !== 0 && cancelledForRefund.length !== 0) {
        responseMessage = 'Order partially accepted and cancelled successfully.';
    }

    // Fetch medicine names for both accepted and cancelled
    // Fetch medicine names for both accepted and cancelled, and merge with quantity/price for accepted
    const [acceptedRaw, cancelledNames] = await Promise.all([
        Medicine.find({ _id: { $in: unCancelledItems.map((i: any) => i.medicineId) } }).select('name coverImage mrp batchNumber unitPackFactor'),
        Medicine.find({ _id: { $in: cancelledForRefund.map((i: any) => i.medicineId) } }).select('name coverImage mrp batchNumber unitPackFactor'),
    ]);

    // Merge acceptedRaw with unCancelledItems to include quantity and price
    const acceptedNames = acceptedRaw.map((m: any) => {
        const item = unCancelledItems.find((i: any) => i.medicineId.toString() === m._id.toString());
        return {
            ...m._doc,
            quantity: item ? item.quantity : 0,
            price: item ? item.price : 0,
        };
    });

    // Merge cancelledNames with cancelledForRefund to include quantity and price
    const cancelledNamesWithDetails = cancelledNames.map((m: any) => {
        const item = cancelledForRefund.find((i: any) => i.medicineId.toString() === m._id.toString());
        return {
            ...m._doc,
            quantity: item ? item.quantity : 0,
            price: item ? item.price : 0,
        };
    });

    // Build email HTML
    let html = `${header}<div><p>Dear ${userName},</p>`;

    let emailSubject: any = `Order Confirmed Successfully`;

    if (cancelledNames.length === 0) {

        emailSubject = `Order Confirmed Successfully`;
        html += `<p>Your order has been Confirmed successfully. Your medicines will be packed and delivered to you soon.</p>`;

    }

    if (acceptedNames.length === 0) {

        emailSubject = `Order Update : Cancelled `;
        html += `<p>Your order  has been Cancelled . We’re sorry that we couldn’t fulfill your order this time.</p>`;

    }

    if (acceptedNames.length > 0 && cancelledNames.length > 0) {

        html += `<p>Your order has been Confirmed. Some medicines are available and confirmed, while a few items could not be fulfilled.</p>`;
        html += `<p>Our pharmacy team has reviewed your order. The confirmed medicines will be packed and delivered to you soon.</p>`;

    }

    html += `<h3 style="margin-top:25px;">Order Summary</h3>`

    if (acceptedNames.length > 0) {
        const defaultImg = 'https://res.cloudinary.com/dqkyleb0t/image/upload/v1768817395/medicine_img-1_sg5xaj.jpg';
        html += '<p><b>Accepted Medicines:</b><ul style="list-style:none;padding:0;">';
        acceptedNames.forEach((m: any) => {
            const imgSrc = m.coverImage && m.coverImage.trim() !== '' ? m.coverImage : defaultImg;
            html += `<li style="margin-bottom:10px;display:flex;align-items:center;">
                    <img src="${imgSrc}" alt="${m.name}" style="width:40px;height:40px;object-fit:cover;border-radius:6px;margin-right:10px;border:1px solid #eee;" />
                               <div>
                <div style="font-weight:500;">${m.name}</div>
                <div style="font-size:14px;color:#555;">
                    Quantity: ${m.quantity}, Price: ₹${Number(m.price).toFixed(2)}
                </div>
            </div>
                </li>`;
        });
        html += '</ul></p>';
    }
    if (cancelledNamesWithDetails.length > 0) {
        const defaultImg = 'https://res.cloudinary.com/dqkyleb0t/image/upload/v1768817395/medicine_img-1_sg5xaj.jpg';
        html += '<p><b>Cancelled Medicines:</b><ul style="list-style:none;padding:0;">';
        cancelledNamesWithDetails.forEach((m: any) => {
            const imgSrc = m.coverImage && m.coverImage.trim() !== '' ? m.coverImage : defaultImg;
            html += `<li style="margin-bottom:10px;display:flex;align-items:center;">
                    <img src="${imgSrc}" alt="${m.name}" style="width:40px;height:40px;object-fit:cover;border-radius:6px;margin-right:10px;border:1px solid #eee;" />
                               <div>
                <div style="font-weight:500;">${m.name}</div>
                <div style="font-size:14px;color:#555;">
                    Quantity: ${m.quantity}, Price: ₹${Number(m.price).toFixed(2)}
                </div>
            </div>
                            </li>`;
        });
        html += `</ul><b>Refund Amount:</b> ₹${Number(refundAmount).toFixed(2)}</p>`;
    }

    html += `<h3 style="margin-top:25px;">Payment Details</h3>
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
    </table>`

    html += `<h3 style="margin-top:25px;">Refund Information</h3>
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="padding:8px;border:1px solid #eee;">Refund Amount</td>
        <td style="padding:8px;border:1px solid #eee;">
          ₹${refundAmount.toFixed(2)}
        </td>
      </tr>
    </table>`

    html += '<p><strong>Note:</strong>The amount for the cancelled items will be credited to your original payment method within <strong>5–7 business days</strong>.Delivery fees are non-refundable.</p>';
    html += '<p>You can track your order status anytime from the My Orders section in the Pharmato app or website.</p>';
    html += '<p>Thank you for choosing Pharmato for your healthcare needs. We’re committed to delivering your medicines safely and on time.</p>';
    html += '<p>Stay healthy,<br/>Team Pharmato<br/>Your trusted pharmacy partner</p></div>';
    html += `${footer}`;

    if (userEmail) {
        await sendEmail({ to: userEmail, subject: emailSubject, html });
    }

    try {
        if (!order?.order_id) return;

        const db = getDb();
        const ref = db.ref(`orders/${order.order_id}/isOrderStatusChanged`);

        ref.transaction((current) => {
            return (Number(current) || 0) + 1;
        });

    } catch (err) {
        console.error('Firebase order status update failed:', err);
    }


    // Create in-app notification for customer and send push notification if device token exists
    try {
        const title = order.order_status == 'Confirmed' ? `Order Confirmed` : `Order Cancelled`;
        const messageInApp = order.order_status == 'Confirmed' ? `Your Order has been confirmed . It will be delievered to you soon.` : `Your Order has Been Cancelled.`;
        const messagePush = order.order_status == 'Confirmed' ? `Your Order has been confirmed.` : `Your Order has Been Cancelled.`;
        // Create in-app notification
        await Notification.create({
            userId: order.userId?.toString?.() || (user?._id?.toString?.() || ''),
            role: 'customer',
            title,
            message: messageInApp,
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
                    title: title,
                    body: messagePush,
                    data: {
                        targetId: order._id.toString(),
                        orderId: order._id.toString(),
                        type: 'order_update',
                        targetScreen: 'orders/detail'
                    }
                });
            } catch (err) {
                console.error('Failed to send push notification (partial-accept):', err);
            }
        }
    } catch (notifErr) {
        console.error('Notification create/send error (partial-accept):', notifErr);
    }

    let itemsHtml = '<h3 style="margin-top:25px;">Order Summary</h3>';
    let refundDetailHtml = '';

    if (acceptedNames.length > 0) {
        const defaultImg = 'https://res.cloudinary.com/dqkyleb0t/image/upload/v1768817395/medicine_img-1_sg5xaj.jpg';
        itemsHtml += '<p><b>Accepted Medicines:</b><ul style="list-style:none;padding:0;">';
        acceptedNames.forEach((m: any) => {
            const imgSrc = m.coverImage && m.coverImage.trim() !== '' ? m.coverImage : defaultImg;
            itemsHtml += `<li style="margin-bottom:10px;display:flex;align-items:center;">
                    <img src="${imgSrc}" alt="${m.name}" style="width:40px;height:40px;object-fit:cover;border-radius:6px;margin-right:10px;border:1px solid #eee;" />
                               <div>
                <div style="font-weight:500;">${m.name}</div>
                <div style="font-size:14px;color:#555;">
                    Quantity: ${m.quantity}, Price: ₹${Number(m.price).toFixed(2)}
                </div>
            </div>
                </li>`;
        });
        itemsHtml += '</ul></p>';
    }
    if (cancelledNamesWithDetails.length > 0) {
        const defaultImg = 'https://res.cloudinary.com/dqkyleb0t/image/upload/v1768817395/medicine_img-1_sg5xaj.jpg';
        itemsHtml += '<p><b>Cancelled Medicines:</b><ul style="list-style:none;padding:0;">';
        cancelledNamesWithDetails.forEach((m: any) => {
            const imgSrc = m.coverImage && m.coverImage.trim() !== '' ? m.coverImage : defaultImg;
            itemsHtml += `<li style="margin-bottom:10px;display:flex;align-items:center;">
                    <img src="${imgSrc}" alt="${m.name}" style="width:40px;height:40px;object-fit:cover;border-radius:6px;margin-right:10px;border:1px solid #eee;" />
                               <div>
                <div style="font-weight:500;">${m.name}</div>
                <div style="font-size:14px;color:#555;">
                    Quantity: ${m.quantity}, Price: ₹${Number(m.price).toFixed(2)}
                </div>
            </div>
                            </li>`;
        });
        itemsHtml += `</ul></p>`;
        itemsHtml += ` <h3 style="margin-top:25px;">Cancellation Reason</h3>
    <div style="padding:12px;background:#fff5f5;border:1px solid #f5c6cb;border-radius:6px;color:#a94442;">
      ${cancelReason}
    </div>`;

        refundDetailHtml += `<h3 style="margin-top:25px;color:#f0ad4e;">Refund Details</h3>
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="padding:8px;border:1px solid #eee;">Refund Amount</td>
        <td style="padding:8px;border:1px solid #eee;font-weight:600;">
          ₹${refundAmount}
        </td>
      </tr>
    </table>`

    }

    // Notify admin (store manager) and superadmins with detailed message
    // let storeName = '';
    let adminName = '';
    let adminEmail = '';
    let adminRoleName = '';
    let customerName = userName;
    if (order.storeId) {
        const storeId = (order as any).storeId;
        if (storeId) {
            const store = await Store.findById(storeId).lean();
            if (store && typeof store === 'object' && !Array.isArray(store)) {
                // storeName = (store as any).name || '';
                if ('adminManagerId' in store && store.adminManagerId) {
                    const admin = await Admin.findById((store as any).adminManagerId).lean();
                    if (admin && typeof admin === 'object' && !Array.isArray(admin)) {
                        adminName = (admin as any).name || '';
                        adminEmail = (admin as any).email || '';

                        let storeNotMsg: any = acceptedNames.length === 0 ? `Order #${order.order_id} for ${userName} has been cancelled.` : `You have confirmed the Order #${order.order_id}. Prepare the order for dispatch.`;

                        const title = acceptedNames.length === 0 ? `Order Cancelled Successfully` : `Order Confirmed Successfully`;

                        // Notify store admin
                        await Notification.create({
                            userId: (store as any).adminManagerId.toString(),
                            role: 'admin',
                            title: 'New Order Received',
                            message: storeNotMsg,
                            type: 'order',
                            targetScreen: 'orders/detail',
                            targetId: order._id.toString(),
                            meta: {}
                        });

                        const storeEmailSubject = acceptedNames.length === 0 ? `Order Cancelled – No Items Confirmed` : `Order Confirmed – Prepare Available Items`;

                        // Send email to adminEmail
                        if (adminEmail) {
                            const adminHtml = `
                                                                        ${header}

                                                                        <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px 0;">
  <div
    style="max-width:700px;margin:0 auto;background:#ffffff;padding:25px;border:1px solid #e6e6e6;border-radius:8px;">

    <p>Hello ${adminName || 'Store Manager'},</p>

    <p style="color:#28a745; font-weight:600;">
      The following order has been Partially Confirmed based on medicine availability.
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
           ${order.deliveredAddress?.phone}
        </td>
      </tr>
      <tr>
        <td style="padding:8px;border:1px solid #eee;">Email ID</td>
        <td style="padding:8px;border:1px solid #eee;">
          ${order.deliveredAddress?.email}
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

    <!-- Refund Details -->
    ${refundDetailHtml}

    <h3 style="margin-top:25px;">Action Required:</h3>
    <ul>
      <li>Pack only the confirmed medicines</li>
      <li>Ensure invoice reflects updated order items</li>
      <li>Handover packed order for dispatch</li>
    </ul>

    <p style="margin-top:25px;">
      Regards,<br />
      <strong>Team Pharmato</strong>
    </p>

  </div>
</div>
                                                                               
                                                                            ${footer}
                                                                        `;
                            await sendEmail({ to: adminEmail, subject: `${storeEmailSubject}`, html: adminHtml });
                        }

                        try {
                            const adminToken = (admin as any).deviceToken;
                            if (adminToken) {
                                await sendPushNotificationWithData({
                                    token: adminToken,
                                    title: title,
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
            // Find store manager name
            let storeManagerName = '';
            if (store && store.adminManagerId) {
                const storeManager: any = await Admin.findById(store.adminManagerId).lean();
                storeManagerName = storeManager?.name || '';
            }

            let supAdminNotMsg: any = acceptedNames.length === 0 ? `Order #${order.order_id} placed by ${userName} has been cancelled by ${storeName}.` : `Order #${order.order_id} placed by ${userName} has been confirmed by ${storeName}.`;

            const title = acceptedNames.length === 0 ? `Order Cancelled` : `Order Confirmed`;

            for (const superAdmin of superAdmins) {
                await Notification.create({
                    userId: (superAdmin as any)._id.toString(),
                    role: 'admin',
                    title: 'Order Update',
                    message: supAdminNotMsg,
                    type: 'order',
                    targetScreen: 'orders/detail',
                    targetId: order._id.toString()
                });

                // Send custom confirmation email to super admin if order is confirmed
                const superAdminEmail = (superAdmin as any).email;
                if (superAdminEmail && order.order_status === 'Confirmed') {

                    const superAdminEmailSubject = acceptedNames.length === 0 ? `Order Cancelled – No Items Confirmed` : `Order Confirmed – Ready for Fulfillment`;

                    const superAdminHtml = `
                    ${header}

                    <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px 0;">
  <div style="max-width:700px;margin:0 auto;background:#ffffff;padding:25px;border:1px solid #e6e6e6;border-radius:8px;">

    <p>Hello Super Admin,</p>

    <p style="color:#28a745; font-weight:600;">
      The following order has been successfully confirmed by the assigned store.
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
          ${storeManagerName}
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
          ${order.deliveredAddress?.phone}
        </td>
      </tr>
      <tr>
        <td style="padding:8px;border:1px solid #eee;">Email ID</td>
        <td style="padding:8px;border:1px solid #eee;">
          ${order.deliveredAddress?.email}
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

    <!-- Refund Details -->
    ${refundDetailHtml}

    <p style="margin-top:25px;">
      The store will proceed with packing and dispatching only the confirmed medicines.
      The refund for cancelled items will be processed separately to the customer.
    </p>

    <p style="margin-top:25px;">
      Regards,<br/>
      <strong>Team Pharmato</strong>
    </p>

  </div>
</div>

                        ${footer}
                    `;
                    await sendEmail({ to: superAdminEmail, subject: superAdminEmailSubject, html: superAdminHtml });
                }

                // Optionally, still send push notification
                try {
                    const superToken = (superAdmin as any).deviceToken;
                    if (superToken) {
                        await sendPushNotificationWithData({
                            token: superToken,
                            title: title,
                            body: supAdminNotMsg,
                            data: {
                                targetId: order._id.toString(),
                                orderId: order.order_id,
                                type: 'order_placed',
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

    if (acceptedNames.length > 0) {

        console.log("###acceptedNames######", acceptedNames);

        // 1️⃣ Extract batch numbers
        const batchNumbersArray = acceptedNames
            .map(item => item.batchNumber)
            .filter(Boolean); // remove null/undefined

        // 2️⃣ Extract quantities
        const quantitiesArray = acceptedNames
            .map(item => item.quantity * (item.unitPackFactor || 1)) // multiply by unitPackFactor if exists
            .filter(q => q !== undefined && q !== null);

        const zeroArray = new Array(batchNumbersArray.length).fill(0);

        // 3️⃣ Convert to comma separated string
        const productCode = batchNumbersArray.join(',');
        const productQuantity = quantitiesArray.join(',');
        const freeItems = zeroArray.join(',');

        console.log("###productCode######productQuantity####freeItems##", productCode, productQuantity, freeItems);

        // //Firebase realtime data update
        // const firebaseRef = db.ref(`marg/order/count`);
        // const snapshot = await firebaseRef.once('value');
        // const totalOrderCount: any = Number(snapshot.val()?.totalOrderCount || 0) + 1
        // await firebaseRef.update({
        //     totalOrderCount: totalOrderCount
        // });

        // const payload = {
        //     OrderID: "",
        //     OrderNo: `${totalOrderCount}`,
        //     // Partycode: "STACjn", //Online order
        //     // CustomerID: "11906405",//12324265
        //     Partycode: "APP   ", //Online order
        //     CustomerID: "12324265",//12324265
        //     MargID: "486257",
        //     Type: "C",
        //     Sid: "306832",

        //     // ProductCode: "1061746",   // ✅ EXACT as Marg sample
        //     ProductCode: `${productCode}`,   // ✅ EXACT as Marg sample
        //     Quantity: `${productQuantity}`,
        //     Free: `${freeItems}`,

        //     Lat: "",
        //     Lng: "",
        //     Address: "",
        //     GpsID: "0",
        //     UserType: "1",
        //     Points: "0.00",

        //     Discounts: "1",
        //     Transport: "",
        //     Delivery: "",

        //     Bankname: "",
        //     BankAdd1: "",
        //     BankAdd2: "",

        //     shipname: "",
        //     shipAdd1: "",
        //     shipAdd2: "",
        //     shipAdd3: "",

        //     paymentmode: "1",
        //     paymentmodeAmount: "0",
        //     payment_remarks: "",
        //     order_remarks: "order place",

        //     CustName: "Sunil",
        //     CustMobile: "7470376772",

        //     DoctorName: "",
        //     DoctorMobile: "",

        //     CompanyCode: "PharmatoInd2",
        //     OrderFrom: "PharmatoInd2"
        // };

        // console.log("#############payload##############", payload);

        // const response = await axios.post(
        //     "https://corporate.margerp.com/api/eOnlineData/InsertOrderDetailB2C",
        //     payload,
        //     { headers: { "Content-Type": "application/json" } }
        // );

        // console.log("📥 RAW:", response.data);

        // const result = await decryptMargData(response.data);

        // console.log("$$$$$$$$$$$result$$$$$$$$$$$$$$", result);

        // if (result?.Details) {

        //     await Order.updateOne(
        //         { _id: order._id },
        //         {
        //             $set: {
        //                 margOrderNo: result?.Details?.OrderDetails[0].OrderNo || '',
        //                 margOrderInsertData: result || {}
        //             }
        //         }
        //     );

        // } else {
        //     console.log("##########result####Kuch to gadbad hain baba#######", result);
        // }

        let invoiceMedicinesHtml = ``
        let invoiceNumber = '';
        let invoiceDate = moment()
            .tz('Asia/Kolkata')
            .format('MMM D, YYYY HH:mm z');
        ;
        let grandTotal = 0;
        let subTotal = 0;
        const deliveryFee = order.calculationData.deliveryFee || 0;
        const discount = order.calculationData.discount || 0;
        const platformFee = order.calculationData.platformFee || 0;
        const razorPayCommissionAmount = order.calculationData.razorPayCommissionAmount || 0;
        const razorPayCommissionGstAmount = order.calculationData.razorPayCommissionGstAmount || 0;
        const allCharges = platformFee + razorPayCommissionAmount + razorPayCommissionGstAmount;

        grandTotal = order.calculationData.totalOrderAmount || 0;
        subTotal = order.calculationData.priceTotalSumAfterDiscount || 0;
        grandTotal = grandTotal - refundAmount
        subTotal = subTotal - refundAmount

        acceptedNames.forEach((m: any) => {
            invoiceMedicinesHtml += `<!-- LOOP START -->
                <tr>
                    <td style="border:1px solid #eaeaea;padding:10px;font-size:14px;color:#555;">
                        ${m.name}
                    </td>
                    <td style="border:1px solid #eaeaea;padding:10px;font-size:14px;text-align:right;color:#555;">
                        ${m.quantity}
                    </td>
                    <td style="border:1px solid #eaeaea;padding:10px;font-size:14px;text-align:right;color:#555;">
                        ₹${m.mrp}
                    </td>
                    <td style="border:1px solid #eaeaea;padding:10px;font-size:14px;text-align:right;color:#555;">
                        ₹${m.price}
                    </td>
                    <td style="border:1px solid #eaeaea;padding:10px;font-size:14px;text-align:right;color:#555;">
                        ₹${m.quantity * m.price}
                    </td>
                </tr>
                <!-- LOOP END -->`
        });

        // Update orderStatus in Firebase Realtime Database
        if (order) {
            const db = getDb();
            const firebaseRef = db.ref(`pharmato`);
            const snapshot = await firebaseRef.once('value');
            const currentInvoiceNumber: any = Number(snapshot.val()?.currentInvoiceNumber || 0) + 1;
            invoiceNumber = `PH-INV-${currentInvoiceNumber}`;
            await firebaseRef.update({
                currentInvoiceNumber: currentInvoiceNumber
            });
        }

        let invoiceHtml = `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>Invoice</title>
</head>

<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;">

    <div style="max-width:800px;margin:24px auto;background-color:#ffffff;padding:32px;border-radius:8px;">

 <!-- HEADER -->
        <div
            style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; border: 1px solid #eee;">
 
            <div
                style="text-align: center; letter-spacing: 2px; font-weight: bold; font-size: 20px; margin-bottom: 30px; color: #000; border-bottom: 2px solid #333; padding-bottom: 10px;">
                INVOICE
            </div>
 
            <div
                style="width: 100%; display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;">
 
                <div style="flex: 1;">
                    <img src="https://res.cloudinary.com/dqkyleb0t/image/upload/v1768915476/Icon_wsihmm.png"
                        alt="Apollo Pharmacy" style="height: 50px; margin-bottom: 12px; display: block;">
 
                    <div style="font-size: 16px; font-weight: 700; color: #000; margin-bottom: 4px;">TREASURE FANTASY
                    </div>
                    <div style="font-size: 13px; line-height: 1.5; color: #555;">
                        GF PLOT NO A-01, LABHAM GREEN GRAM,<br>
                        <span style="font-weight: 600;">Phone:</span> +91-7225026829
                    </div>
                </div>
 
                <div
                    style="flex: 1; text-align: right; font-size: 11px; line-height: 1.8; color: #444;  padding: 10px; border-radius: 4px;">
                    <div><strong style="color: #000;">FSSAI No:</strong> 11424850000976</div>
                    <div><strong style="color: #000;">D.L. No:</strong> 20/3838-41/110/2024-20,21,20B,21B</div>
                    <div><strong style="color: #000;">GST No:</strong> 23AAPCA5954P1ZZ</div>
                    <div><strong style="color: #000;">CIN:</strong> U52500TN2016PLC111328</div>
                </div>
 
            </div>
        </div>

        <hr style="margin: 15px 0;">

        <!-- CUSTOMER DETAILS -->
        <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
            <tr>
                <td><strong>Name:</strong> ${userName}</td>
                <td><strong>Invoice No:</strong> ${invoiceNumber}</td>
            </tr>
            <tr>
                <td><strong>Mobile:</strong> +91-${userMobile}</td>
                <td><strong>Bill Date:</strong> ${invoiceDate}</td>
            </tr>
            <tr>
                <td><strong>Address:</strong> ${deliveryAddressText}</td>
            </tr>
        </table>

        <hr style="margin: 15px 0;">

        <!-- ITEMS TABLE -->
        <table style="width:100%;border-collapse:collapse;">
            <thead>
                <tr style="background-color:#f8f9fa;">
                    <th style="border:1px solid #eaeaea;padding:10px;font-size:14px;text-align:left;color:#333;">Product
                        Name</th>
                    <th style="border:1px solid #eaeaea;padding:10px;font-size:14px;text-align:right;color:#333;">
                        Quantity</th>
                    <th style="border:1px solid #eaeaea;padding:10px;font-size:14px;text-align:right;color:#333;">MRP
                    </th>
                    <th style="border:1px solid #eaeaea;padding:10px;font-size:14px;text-align:right;color:#333;">
                        Discounted Price</th>
                    <th style="border:1px solid #eaeaea;padding:10px;font-size:14px;text-align:right;color:#333;">Amount
                    </th>
                </tr>
            </thead>
            <tbody>

                ${invoiceMedicinesHtml}

            </tbody>
        </table>

        <!-- SUMMARY -->
        <table style="width:100%;margin-top:16px;border-collapse:collapse;">
            <tr>
                <td style="padding:6px 10px;text-align:right;font-size:14px;color:#333;">
                    Subtotal:
                </td>
                <td style="padding:6px 10px;text-align:right;font-size:14px;font-weight:bold;">
                    ₹${subTotal}
                </td>
            </tr>
            ${discount == 0 ? '' : `<tr>
                <td style="padding:6px 10px;text-align:right;font-size:14px;color:#333;">
                    Discount:
                </td>
                <td style="padding:6px 10px;text-align:right;font-size:14px;font-weight:bold;">
                    ₹${discount}
                </td>
            </tr>`}
            ${allCharges == 0 ? '' : `<tr>
                <td style="padding:6px 10px;text-align:right;font-size:14px;color:#333;">
                    Platform Fee:
                </td>
                <td style="padding:6px 10px;text-align:right;font-size:14px;font-weight:bold;">
                    ₹${allCharges}
                </td>
            </tr>`}
            ${deliveryFee == 0 ? '' : `<tr>
                <td style="padding:6px 10px;text-align:right;font-size:14px;color:#333;">
                    Delivery Fee:
                </td>
                <td style="padding:6px 10px;text-align:right;font-size:14px;font-weight:bold;">
                    ₹${deliveryFee}
                </td>
            </tr>`}
            <tr>
                <td style="padding:10px 10px;text-align:right;font-size:18px;font-weight:bold;color:#000;">
                    Grand Total:
                </td>
                <td style="padding:10px 10px;text-align:right;font-size:18px;font-weight:bold;color:#000;">
                    ₹${grandTotal}
                </td>
            </tr>
        </table>

        <!-- FOOTER -->
        <div style="margin-top:32px;border-top:1px dashed #ddd;padding-top:16px;text-align:center;">
            <p style="margin:6px 0;font-size:13px;color:#777;">
                Thank you for your purchase!
            </p>
            <p style="margin:6px 0;font-size:13px;color:#777;">
                This is a system generated invoice.
            </p>
        </div>

    </div>

</body>

</html>`

        const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        await page.setCacheEnabled(false); // Disable cache

        // Set the page content with an increased timeout
        await page.setContent(invoiceHtml, { timeout: 60000, waitUntil: 'networkidle0' });// Wait for network to be idle

        const pdfBuffer: any = await page.pdf({
            format: 'A4',
            margin: {
                top: 70,
                right: 50,
                bottom: 50,
                left: 50,
            },
            timeout: 60000 // Increase timeout here as well
        });

        const publicId = `INV_${Date.now()}`;
        // const result = await uploadToCloudinary(buffer, publicId);
        const resultCloudinary = await uploadToCloudinary(
            pdfBuffer,
            publicId,
            'raw'
        );

        let invoiceUrl = '';
        if (resultCloudinary && (resultCloudinary as any).secure_url) {
            invoiceUrl = (resultCloudinary as any).secure_url;
        }

        await Order.updateOne(
            { _id: order._id },
            {
                $set: { invoice_url: invoiceUrl }
            }
        );

    }

}

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
        const user = await User.findOne({ _id: new mongoose.Types.ObjectId(order.userId) });

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

        setImmediate(() => {
            runBackground(order, user, unCancelledItems, cancelReason);
        });

        return NextResponse.json({ success: true, message: 'Order status updated', data: order });
    } catch (error) {
        console.error('Partial accept error:', error);
        return NextResponse.json({ success: false, message: 'Failed to accept/cancel medicines', error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
}
