import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import Notification from '@/models/Notification';
import { sendEmail } from '@/utils/sendEmail';
import fs from 'fs';
import path from 'path';
import { getDb, sendPushNotificationWithData } from '@/utils/firebase.helper';
import User from '@/models/User';
import Admin from '@/models/Admin';
import Store from '@/models/Store';
import Role from '@/models/Role';
import Medicine from '@/models/Medicine';

/**
 * @swagger
 * /api/admin/order/prescription/reject:
 *   post:
 *     summary: Reject prescription for an order
 *     tags:
 *       - Admin Orders - Prescription
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
 *               adminId:
 *                 type: string
 *                 description: Admin's ObjectId
 *                 required: true
 *               rejectionReason:
 *                 type: string
 *                 description: Reason for rejection
 *                 required: true
 *     responses:
 *       200:
 *         description: Prescription rejected successfully
 *       400:
 *         description: Missing or invalid input
 *       404:
 *         description: Order not found
 */

export async function POST(req: NextRequest) {
    await dbConnect();

    try {
        const { orderId, adminId, rejectionReason, prescription_url } = await req.json();

        if (!orderId || !adminId || !rejectionReason) {
            return NextResponse.json(
                { success: false, message: 'orderId, adminId, and rejectionReason are required' },
                { status: 400 }
            );
        }

        // const order = await Order.findById(orderId).populate({ path: 'userId', select: '_id order_id name email mobile phone' });
        const order = await Order.findOne({ _id: orderId });

        if (!order) {
            return NextResponse.json(
                { success: false, message: 'Order not found' },
                { status: 404 }
            );
        }

        // Update prescription status. Do NOT overwrite existing prescription_url
        // unless the request explicitly provides a value for it.
        order.prescription_status = 'Rejected';
        order.prescription_rejected_by = adminId;
        order.prescription_rejected_at = new Date();
        order.prescription_rejection_reason = rejectionReason;
        if (typeof prescription_url !== 'undefined') {
            order.prescription_url = prescription_url;
        }

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

        const [checkMedicineId] = await Promise.all([
            Medicine.find({ _id: { $in: order.medicineId.map((i: any) => i) } }).select('_id name coverImage images'),
        ]);

        console.log('##########checkMedicineId#############', checkMedicineId);

        const acceptedNames = checkMedicineId.map((m: any) => {
            const item = order.medicineQuantity.find((i: any) => i.medicineId.toString() === m._id.toString());
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

        // Create in-app notification for customer
        try {
            const userIdStr = order.userId && (order.userId._id ? order.userId._id.toString() : order.userId.toString());
            if (userIdStr) {
                await Notification.create({
                    userId: userIdStr,
                    role: 'customer',
                    title: 'Prescription Rejected',
                    message: `Prescription Rejected : Your prescription has been rejected. Please re-upload a valid prescription or contact the store manager.`,
                    type: 'prescription_rejected',
                    targetScreen: 'orders/detail',
                    targetId: order._id.toString(),
                    meta: {
                        orderId: order._id.toString(),
                        rejectionReason
                    }
                });
            }
        } catch (notifErr) {
            console.error('Notification create error:', notifErr);
        }

        // Get user info
        const user = await User.findById(order.userId);
        if (user && user.deviceToken) {
            try {
                await sendPushNotificationWithData({
                    token: user.deviceToken,
                    title: 'Pharmato',
                    body: `Your prescription has been rejected. Re-upload Required.`,
                    data: {
                        targetId: order._id.toString(),
                        orderId: order._id.toString(),
                        type: 'prescription_rejected',
                        targetScreen: 'orders/detail',
                        rejectionReason
                    }
                });
            } catch (err) {
                console.error('Failed to send notification:', err);
            }
        }

        // Send email to customer if email available using template
        if (userEmail) {
            const base = process.env.NEXT_PUBLIC_BASE_URL || '';
            const orderUrl = `${base}/customer/orders/${order._id}`;
            const subject = `Prescription Rejected - Order ${order.order_id}`;
            const headerPath = path.join(process.cwd(), 'src/app/api/admin/html-templates/emailHeader.html');
            const footerPath = path.join(process.cwd(), 'src/app/api/admin/html-templates/emailFooter.html');
            const contentPath = path.join(process.cwd(), 'src/app/api/admin/html-templates/prescriptionRejected.html');
            let html = '';
            try {
                let header = fs.readFileSync(headerPath, 'utf8');
                // Replace baseUrl placeholder so images have absolute URL in email clients
                const baseForEmail = base || (process.env.NEXT_PUBLIC_BASE_URL || '');
                header = header.replace(/{{baseUrl}}/g, baseForEmail);
                const content = fs.readFileSync(contentPath, 'utf8')
                    .replace(/{{UserName}}/g, (order.userId && order.userId.name) || '')
                    .replace(/{{OrderID}}/g, order.order_id || '')
                    .replace(/{{RejectionReason}}/g, rejectionReason || '')
                    .replace(/{{ReuploadLink}}/g, orderUrl);
                const footer = fs.readFileSync(footerPath, 'utf8');
                html = header + content + footer;
            } catch (readErr) {
                console.error('Email template read error:', readErr);
                // fallback simple html
                html = `<p>Hi ${userName},</p><p>Your prescription for order <strong>${order.order_id}</strong> has been rejected. Reason: ${rejectionReason}</p>`;
            }
            await sendEmail({ to: userEmail, subject, html });
        }

        // Choose template based on create or update
        const headerPath = path.join(process.cwd(), 'src/app/api/admin/html-templates/emailHeader.html');
        const footerPath = path.join(process.cwd(), 'src/app/api/admin/html-templates/emailFooter.html');
        const header = fs.readFileSync(headerPath, 'utf8');
        const footer = fs.readFileSync(footerPath, 'utf8');

        // Notify admin (store manager) and superadmins with detailed message
        let storeName = '';
        let adminName = '';
        let adminEmail = '';
        let adminRoleName = '';
        let customerName = userName;
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
                                title: 'Prescription Rejected',
                                message: `You have rejected the prescription for Order #${order.order_id}. Awaiting prescription re-upload from the user.`,
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
  <div style="max-width:700px;margin:0 auto;background:#ffffff;padding:25px;border:1px solid #e6e6e6;border-radius:8px;">

    <p>Hello ${adminName || 'Store Manager'},</p>

    <p style="color:#d9534f; font-weight:600;">
      The prescription submitted for the following order has been rejected. ❌
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
        <td style="padding:8px;border:1px solid #eee;">
          Order Placed
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

    <!-- Items -->
    <h3 style="margin-top:25px;">Items in Order</h3>
    ${itemsHtml}

    <!-- Rejection Reason -->
    <h3 style="margin-top:25px;color:#d9534f;">Rejection Reason</h3>
    <div style="padding:12px;background:#fff5f5;border:1px solid #f5c6cb;border-radius:6px;color:#a94442;">
      ${rejectionReason}
    </div>

    <!-- Status Update -->
    <h3 style="margin-top:25px;">Status Update</h3>
    <ul style="padding-left:18px;">
      <li>The customer has been notified to upload a valid prescription</li>
      <li>Order processing is currently on hold</li>
      <li>No fulfillment action is required until a new prescription is submitted</li>
    </ul>

    <p style="margin-top:20px;">
      You will receive another notification once the customer re-uploads the prescription for review.
    </p>

    <p style="margin-top:25px;">
      Regards,<br/>
      <strong>Team Pharmato</strong>
    </p>

  </div>
</div>
                                                                               
                                                                            ${footer}
                                                                        `;
                                await sendEmail({ to: adminEmail, subject: `Prescription Rejected – Awaiting Customer Re-upload`, html: adminHtml });
                            }

                            try {
                                const adminToken = (admin as any).deviceToken;
                                if (adminToken) {
                                    await sendPushNotificationWithData({
                                        token: adminToken,
                                        title: 'Pharmato',
                                        body: `You have rejected the prescription for Order #${order.order_id}. Awaiting prescription re-upload from the user.`,
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
        const superAdminRole = await Role.findOne({ name: /superadmin/i });
        if (superAdminRole && superAdminRole._id) {
            const superAdmins = await Admin.find({ roleId: superAdminRole._id }).lean();
            for (const superAdmin of superAdmins) {
                if (superAdmin && typeof superAdmin === 'object' && !Array.isArray(superAdmin) && '_id' in superAdmin) {
                    await Notification.create({
                        userId: (superAdmin as any)._id.toString(),
                        role: 'admin',
                        title: 'Prescription Rejected',
                        message: `Prescription Rejected: Prescription for order ${order.order_id} placed by ${customerName} has been rejected by ${storeName}. Awaiting Prescription Reupload.`,
                        type: 'prescription_rejected',
                        targetScreen: 'orders/detail',
                        targetId: (order as any)._id.toString(),
                        meta: {
                            order_id: order.order_id,
                            customerName,
                            storeName
                        }
                    });

                    // Send email to super admin
                    const superAdminEmail = (superAdmin as any).email;
                    if (superAdminEmail) {
                        const superAdminHtml = `${header}
                        
                        <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px 0;">
  <div style="max-width:700px;margin:0 auto;background:#ffffff;padding:25px;border:1px solid #e6e6e6;border-radius:8px;">

    <p>Hello Super Admin,</p>

    <p style="color:#d9534f; font-weight:600;">
      The prescription has been rejected by the assigned store. ❌
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
        <td style="padding:8px;border:1px solid #eee;">
          Order Placed
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

    <!-- Rejection Reason -->
    <h3 style="margin-top:25px;color:#d9534f;">Reason for Rejection</h3>
    <div style="padding:12px;background:#fff5f5;border:1px solid #f5c6cb;border-radius:6px;color:#a94442;">
      ${rejectionReason}
    </div>

    <p style="margin-top:25px;">
      The customer has been notified to re-upload a valid prescription.
      The order will remain on hold until a new prescription is reviewed and approved.
    </p>

    <p>
      You will receive another notification once the customer re-uploads the prescription for review.
    </p>

    <p style="margin-top:25px;">
      Regards,<br/>
      <strong>Team Pharmato</strong>
    </p>

  </div>
</div>
                            
                                                            ${footer}
                                                        `;
                        await sendEmail({ to: superAdminEmail, subject: `Prescription Rejected by ${storeName}`, html: superAdminHtml });
                    }

                    try {
                        const superToken = (superAdmin as any).deviceToken;
                        if (superToken) {
                            await sendPushNotificationWithData({
                                token: superToken,
                                title: 'Pharmato',
                                body: `Prescription Rejected: Prescription for order ${order.order_id} placed by ${customerName} has been rejected by ${storeName}. Awaiting Prescription Reupload.`,
                                data: {
                                    targetId: order._id.toString(),
                                    orderId: order._id.toString(),
                                    type: 'prescription_rejected',
                                    targetScreen: 'orders/detail',
                                }
                            });
                        }
                    } catch (err) {
                        console.error('Failed to send push notification to superadmin:', err);
                    }
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Prescription rejected successfully',
            data: order
        });

    } catch (error) {
        console.error('Error rejecting prescription:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to reject prescription' },
            { status: 500 }
        );
    }
}
