import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { sendEmail } from '@/utils/sendEmail';
import { sendPushNotificationWithData } from '@/utils/firebase.helper';
import Medicine from '@/models/Medicine';

/**
 * @swagger
 * /api/customer/order/prescription-reupload:
 *   post:
 *     summary: Re-upload prescription for an order (customer)
 *     tags:
 *       - Customer Orders - Prescription
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
 *               url:
 *                 oneOf:
 *                   - type: string
 *                   - type: array
 *                     items:
 *                       type: string
 *                 description: URL or array of URLs of the uploaded prescription image/pdf
 *             example:
 *               orderId: "string"
 *               url: ["string", "string"]
 *     responses:
 *       200:
 *         description: Prescription re-uploaded successfully
 *       400:
 *         description: Missing or invalid input
 *       404:
 *         description: Order not found
 */
export async function POST(req: NextRequest) {
    await dbConnect();
    try {
        const { orderId, url } = await req.json();

        if (!orderId || !url) {
            return NextResponse.json({ success: false, message: 'orderId and url are required' }, { status: 400 });
        }

        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return NextResponse.json({ success: false, message: 'Invalid orderId' }, { status: 400 });
        }

        const orderDoc: any = await Order.findById(orderId).lean();
        if (!orderDoc) {
            return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
        }

        // Normalize url to array of strings
        let prescriptionUrlArr: string[] = [];
        if (Array.isArray(url)) {
            prescriptionUrlArr = url.filter((u) => typeof u === 'string');
        } else if (typeof url === 'string' && url) {
            prescriptionUrlArr = [url];
        }

        // Update order fields
        const OrderModel = (await import('@/models/Order')).default;
        await OrderModel.updateOne(
            { _id: orderId },
            {
                $set: {
                    prescription_url: prescriptionUrlArr,
                    prescription_status: 'Pending',
                    prescription_rejection_reason: '',
                    prescription_rejected_by: null,
                    prescription_rejected_at: undefined
                }
            }
        );

        // Notification logic for store manager and superadmin
        try {
            const Store = (await import('@/models/Store')).default;
            const Admin = (await import('@/models/Admin')).default;
            const Notification = (await import('@/models/Notification')).default;
            const Role = (await import('@/models/Role')).default;
            const User = (await import('@/models/User')).default;

            // Choose template based on create or update
            const headerPath = path.join(process.cwd(), 'src/app/api/admin/html-templates/emailHeader.html');
            const footerPath = path.join(process.cwd(), 'src/app/api/admin/html-templates/emailFooter.html');
            const header = fs.readFileSync(headerPath, 'utf8');
            const footer = fs.readFileSync(footerPath, 'utf8');

            // Get store and admin manager
            let storeName = '';
            let adminName = '';
            let adminEmail = '';
            let adminRoleName = '';
            let customerName = 'Customer';
            let userEmail = '';
            let storeId = (orderDoc as any).storeId;
            let deliveryAddressText = ''
            let previousRejectionReason = orderDoc?.prescription_rejection_reason || 'N/A';

            const deliveredAddr: any = orderDoc.deliveredAddress || null;
            if (deliveredAddr) {
                customerName = deliveredAddr?.name || 'Customer';
                userEmail = deliveredAddr?.email || '';
                deliveryAddressText = `${deliveredAddr.address.houseNumber}, ${deliveredAddr.address.locality}, ${deliveredAddr.address.landmark}, ${deliveredAddr.address.city}, ${deliveredAddr.address.state} - ${deliveredAddr.address.pinCode}`;
            }

            const [checkMedicineId] = await Promise.all([
                Medicine.find({ _id: { $in: orderDoc.medicineId.map((i: any) => i) } }).select('_id name coverImage images'),
            ]);

            console.log('##########checkMedicineId#############', checkMedicineId);

            const acceptedNames = checkMedicineId.map((m: any) => {
                const item = orderDoc.medicineQuantity.find((i: any) => i.medicineId.toString() === m._id.toString());
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


            if (storeId) {
                const store = await Store.findById(storeId).lean();
                if (store && typeof store === 'object' && !Array.isArray(store)) {
                    storeName = store.name || '';
                    if ('adminManagerId' in store && store.adminManagerId) {
                        const admin = await Admin.findById(store.adminManagerId).lean();
                        if (admin && typeof admin === 'object' && !Array.isArray(admin)) {
                            adminName = admin.name || '';
                            adminEmail = admin.email || '';
                            // Try to get admin's role name
                            if ('roleId' in admin && admin.roleId) {
                                const roleDoc = await Role.findById(admin.roleId).lean();
                                if (roleDoc && typeof roleDoc === 'object' && !Array.isArray(roleDoc)) {
                                    adminRoleName = roleDoc.name || '';
                                }
                            }
                            // Notify store admin (manager)
                            await Notification.create({
                                userId: store.adminManagerId.toString(),
                                role: 'admin',
                                title: 'Prescription Re-uploaded',
                                message: `Prescription Re-uploaded: ${customerName} has re-uploaded prescription for Order #${orderDoc.order_id}. Please review and take action.`,
                                type: 'prescription',
                                targetScreen: 'orders/detail',
                                targetId: (orderDoc as any)._id.toString(),
                                meta: {
                                    prescriptionUrlArr,
                                    customerName,
                                    storeName,
                                    orderId: (orderDoc as any)._id.toString(),
                                    order_id: (orderDoc as any).order_id
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
      The customer has re-uploaded a prescription for the below order. 🔄<br/>
      Kindly review the newly submitted prescription to continue processing.
    </p>

    <!-- Order Details -->
    <h3 style="margin-top:25px;">Order Details</h3>
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="padding:8px;border:1px solid #eee;font-weight:600;">Order ID</td>
        <td style="padding:8px;border:1px solid #eee;">
          #${orderDoc.order_id}
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
          ${new Date(orderDoc.createdAt).toLocaleString()}
        </td>
      </tr>
    </table>

    <!-- Customer Details -->
    <h3 style="margin-top:25px;">Customer Details</h3>
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="padding:8px;border:1px solid #eee;">Customer Name</td>
        <td style="padding:8px;border:1px solid #eee;">
          ${orderDoc.deliveredAddress?.name}
        </td>
      </tr>
      <tr>
        <td style="padding:8px;border:1px solid #eee;">Mobile Number</td>
        <td style="padding:8px;border:1px solid #eee;">
          ${orderDoc.deliveredAddress?.mobileNumber}
        </td>
      </tr>
      <tr>
        <td style="padding:8px;border:1px solid #eee;">Email ID</td>
        <td style="padding:8px;border:1px solid #eee;">
          ${orderDoc.userEmail}
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

    <!-- Previous Rejection Reason -->
    <h3 style="margin-top:25px;color:#d9534f;">Previous Rejection Reason</h3>
    <div style="padding:12px;background:#fff5f5;border:1px solid #f5c6cb;border-radius:6px;color:#a94442;">
      ${previousRejectionReason}
    </div>

    <!-- Action Required -->
    <h3 style="margin-top:25px;color:#f0ad4e;">Action Required</h3>
    <ul style="padding-left:18px;">
      <li>Review the newly uploaded prescription</li>
      <li>Ensure previous issues have been corrected</li>
      <li>Approve the prescription if valid</li>
      <li>Reject again with updated reason if still non-compliant</li>
    </ul>

    <p style="margin-top:20px;">
      You can review the updated prescription from the <strong>Admin Portal</strong>.
    </p>

    <p style="margin-top:25px;">
      Regards,<br/>
      <strong>Team Pharmato</strong>
    </p>

  </div>
</div>
      
                                    ${footer}
                                `;
                                await sendEmail({ to: adminEmail, subject: `Prescription Re-uploaded – Verification Required`, html: adminHtml });
                            }

                            try {
                                const adminToken = (admin as any).deviceToken;
                                if (adminToken) {
                                    await sendPushNotificationWithData({
                                        token: adminToken,
                                        title: 'Pharmato',
                                        body: `Prescription Re-uploaded: ${customerName} has re-uploaded prescription for Order #${orderDoc.order_id}. Please review and take action.`,
                                        data: {
                                            targetId: orderDoc._id.toString(),
                                            orderId: orderDoc._id.toString(),
                                            type: 'prescription_reuploaded',
                                            targetScreen: 'orders/detail',
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

            // Notify all superadmins
            const superAdminRole = await Role.findOne({ name: /superadmin/i });
            if (superAdminRole && superAdminRole._id) {
                const superAdmins = await Admin.find({ roleId: superAdminRole._id }).lean();
                for (const superAdmin of superAdmins) {
                    if (superAdmin && typeof superAdmin === 'object' && !Array.isArray(superAdmin) && '_id' in superAdmin) {
                        await Notification.create({
                            userId: (superAdmin as any)._id.toString(),
                            role: 'admin',
                            title: 'Prescription Re-uploaded',
                            message: `Prescription Re-uploaded: Prescription for order #${orderDoc.order_id} has been re-uploaded by ${customerName}. Awaiting verification from ${storeName || 'N/A'}.`,
                            type: 'prescription_reuploaded',
                            targetScreen: 'orders/detail',
                            targetId: (orderDoc as any)._id.toString(),
                            meta: {
                                prescriptionUrlArr,
                                customerName,
                                storeName,
                                orderId: (orderDoc as any)._id.toString(),
                                order_id: (orderDoc as any).order_id
                            }
                        });

                        try {
                            const superToken = (superAdmin as any).deviceToken;
                            if (superToken) {
                                await sendPushNotificationWithData({
                                    token: superToken,
                                    title: 'Pharmato',
                                    body: `Prescription Re-uploaded: ${customerName} has re-uploaded prescription for Order #${orderDoc.order_id}. Please review and take action.`,
                                    data: {
                                        targetId: orderDoc._id.toString(),
                                        orderId: orderDoc._id.toString(),
                                        type: 'prescription_reuploaded',
                                        targetScreen: 'orders/detail',
                                    }
                                });
                            }
                        } catch (err) {
                            console.error('Failed to send push notification to superadmin:', err);
                        }

                        // Send email to super admin
                        const superAdminEmail = (superAdmin as any).email;
                        if (superAdminEmail) {
                            const superAdminHtml = `
                            ${header}

                            <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px 0;">
  <div style="max-width:700px;margin:0 auto;background:#ffffff;padding:25px;border:1px solid #e6e6e6;border-radius:8px;">

    <p>Hello Super Admin,</p>

    <p>
      The customer has re-uploaded the prescription for the below order after the previous rejection. 🔄<br/>
      The assigned store has been notified to review the updated document.
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
          #${orderDoc.order_id}
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
          ${new Date(orderDoc.createdAt).toLocaleString()}
        </td>
      </tr>
    </table>

    <!-- Customer Details -->
    <h3 style="margin-top:25px;">Customer Details</h3>
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="padding:8px;border:1px solid #eee;">Customer Name</td>
        <td style="padding:8px;border:1px solid #eee;">
          ${orderDoc.deliveredAddress?.name}
        </td>
      </tr>
      <tr>
        <td style="padding:8px;border:1px solid #eee;">Mobile Number</td>
        <td style="padding:8px;border:1px solid #eee;">
          ${orderDoc.deliveredAddress?.mobileNumber}
        </td>
      </tr>
      <tr>
        <td style="padding:8px;border:1px solid #eee;">Email ID</td>
        <td style="padding:8px;border:1px solid #eee;">
          ${orderDoc.userEmail}
        </td>
      </tr>
      <tr>
        <td style="padding:8px;border:1px solid #eee;">Delivery Address</td>
        <td style="padding:8px;border:1px solid #eee;">
          ${deliveryAddressText}
        </td>
      </tr>
    </table>

    <!-- Previous Rejection Reason -->
    <h3 style="margin-top:25px;color:#d9534f;">Previous Rejection Reason</h3>
    <div style="padding:12px;background:#fff5f5;border:1px solid #f5c6cb;border-radius:6px;color:#a94442;">
      ${previousRejectionReason}
    </div>

    <p style="margin-top:25px;">
      The order is currently on hold and will proceed once the store reviews and approves
      the newly submitted prescription.
    </p>

    <p style="margin-top:25px;">
      Regards,<br/>
      <strong>Team Pharmato</strong>
    </p>

  </div>
</div>

                                ${footer}
                            `;
                            await sendEmail({ to: superAdminEmail, subject: `Prescription Re-uploaded – Awaiting Review`, html: superAdminHtml });
                        }
                    }
                }
            }

            // If order is delivered, send delivered email to customer
            try {
                const statusLower = String(status || '').toLowerCase();
                if (statusLower.includes('deliv')) {

                    let deliveryAddressText = ''

                    if (deliveredAddr) {
                        deliveryAddressText = `${deliveredAddr.address.houseNumber}, ${deliveredAddr.address.locality}, ${deliveredAddr.address.landmark}, ${deliveredAddr.address.city}, ${deliveredAddr.address.state} - ${deliveredAddr.address.pinCode}`;
                    }

                    const subject = `Prescription Re-uploaded – Action Required for Order #${orderDoc.order_id}`;
                    const html = `${header}
                    <div style="font-family: Arial, sans-serif; color:#333; line-height:1.4;">
                        <div style="max-width:700px;margin:0 auto;padding:20px;border:1px solid #e6e6e6;">
                            <p>Hello ${storeName},</p>
                            <p>The customer has **re-uploaded a prescription** for order #${orderDoc.order_id} after previous rejection.</p>
                            <h4>Order Summary:</h4>
                            <p>Order ID: <strong>#${orderDoc.order_id}</strong></p>
                            <p>Order Status: <strong>Delivered</strong></p>
                            <p>Delivery Address: ${deliveryAddressText || 'Not available'}</p>
                            <p><strong>Action Required</strong></p>
                            <p>Please review the updated prescription and take appropriate action:</p>
                            <p>* Approve to proceed with the order</p>
                            <p>* Reject with reason if still not valid</p>
                            <p>Log in to admin Portal  to continue.</p>
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

        } catch (notifyErr) {
            console.error('Notification error on prescription re-upload:', notifyErr);
        }

        // Return updated order
        const updatedOrder = await OrderModel.findById(orderId).lean();
        return NextResponse.json({ success: true, message: 'Prescription re-uploaded', data: updatedOrder });
    } catch (err: any) {
        console.error('Prescription reupload error:', err);
        return NextResponse.json({ success: false, message: 'Failed to re-upload prescription', error: err?.message || String(err) }, { status: 500 });
    }
}
