import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import Notification from '@/models/Notification';
import { sendEmail } from '@/utils/sendEmail';
import { getDb, sendPushNotificationWithData } from '@/utils/firebase.helper';
import fs from 'fs';
import path from 'path';
import User from '@/models/User';
import Admin from '@/models/Admin';
import Store from '@/models/Store';
import Role from '@/models/Role';
import Medicine from '@/models/Medicine';

/**
 * @swagger
 * /api/admin/order/prescription/approve:
 *   post:
 *     summary: Approve prescription for an order
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
 *     responses:
 *       200:
 *         description: Prescription approved successfully
 *       400:
 *         description: Missing or invalid input
 *       404:
 *         description: Order not found
 */

export async function POST(req: NextRequest) {
  await dbConnect();

  try {
    const { orderId, adminId, approvalNotes } = await req.json();

    if (!orderId || !adminId) {
      return NextResponse.json(
        { success: false, message: 'orderId and adminId are required' },
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

    // Update prescription status
    order.prescription_status = 'Approved';
    order.prescription_approved_by = adminId;
    order.prescription_approved_at = new Date();
    order.prescription_approval_notes = approvalNotes || '';
    order.prescription_rejection_reason = '';

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

    // Send email to customer if email available using template
    let mailRes: any = null;
    try {
      if (userEmail) {
        // console.log('Preparing approval email for:', userEmail);
        const base = process.env.NEXT_PUBLIC_BASE_URL || '';
        const subject = `Order Update : Prescription Approved`;
        const headerPath = path.join(process.cwd(), 'src/app/api/admin/html-templates/emailHeader.html');
        const footerPath = path.join(process.cwd(), 'src/app/api/admin/html-templates/emailFooter.html');
        const contentPath = path.join(process.cwd(), 'src/app/api/admin/html-templates/prescriptionApproved.html');
        let html = '';
        try {
          let header = fs.readFileSync(headerPath, 'utf8');
          const baseForEmail = base || (process.env.NEXT_PUBLIC_BASE_URL || '');
          header = header.replace(/{{baseUrl}}/g, baseForEmail);
          const content = fs.readFileSync(contentPath, 'utf8')
            .replace(/{{UserName}}/g, (userName || '').toString())
            .replace(/{{OrderID}}/g, order.order_id || '')
            .replace(/{{DeliveryAddress}}/g, deliveryAddressText);
          const footer = fs.readFileSync(footerPath, 'utf8');
          html = header + content + footer;
        } catch (readErr) {
          console.error('Email template read error:', readErr);
          html = `<p>Hi ${userName || ''},</p><p>Your prescription for order <strong>${order.order_id}</strong> has been approved.</p>`;
        }
        mailRes = await sendEmail({ to: userEmail, subject, html });
        console.log('Approval email send result:', mailRes);
      }
    } catch (emailErr) {
      console.error('Email send error on approve:', emailErr);
    }

    // Create in-app notification for customer
    let notifRes: any = null;
    try {
      const userIdStr = order.userId?.toString?.();
      if (userIdStr) {
        notifRes = await Notification.create({
          userId: userIdStr,
          role: 'customer',
          title: 'Prescription Approved',
          message: `Order Update : Your prescription has been approved by the store.`,
          type: 'prescription_approved',
          targetScreen: 'orders/detail',
          targetId: order._id.toString(),
          meta: { orderId: order._id.toString() }
        });
      }
    } catch (notifErr) {
      console.error('Notification create error (approve):', notifErr);
    }

    // Get user info
    const user = await User.findById(order.userId);
    if (user && user.deviceToken) {
      try {
        await sendPushNotificationWithData({
          token: user.deviceToken,
          title: 'Pharmato',
          body: `Your prescription has been approved by the store. `,
          data: {
            targetId: order._id.toString(),
            orderId: order._id.toString(),
            type: 'prescription_approved',
            targetScreen: 'orders/detail'
          }
        });
      } catch (err) {
        console.error('Failed to send notification:', err);
      }
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
                title: 'New Order Received',
                message: `Prescription Approved: You have approved the prescription for Order #${order.order_id}. Please proceed with order confirmation.`,
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

    <p>
      The prescription for the following order has been reviewed and approved. ✅<br/>
      You may now proceed with order confirmation.
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
        <td style="padding:8px;border:1px solid #eee;">Name</td>
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

    <!-- Action Required -->
    <h3 style="margin-top:25px;color:#d9534f;">Action Required</h3>
    <ul style="padding-left:18px;">
      <li>Re-confirm medicine availability in inventory</li>
      <li>Finalize the order confirmation</li>
      <li>Initiate packing for confirmed items</li>
    </ul>

    <p style="margin-top:20px;">
      This order is now ready for fulfillment processing.
    </p>

    <p style="margin-top:25px;">
      Regards,<br/>
      <strong>Team Pharmato</strong>
    </p>

  </div>
</div>
                                                                               
                                                                            ${footer}
                                                                        `;
                await sendEmail({ to: adminEmail, subject: `Prescription Approved – Proceed to Confirm Order`, html: adminHtml });
              }

              try {
                const adminToken = (admin as any).deviceToken;
                if (adminToken) {
                  await sendPushNotificationWithData({
                    token: adminToken,
                    title: 'Pharmato',
                    body: `Prescription Approved: You have approved the prescription for Order #${order.order_id}. Please proceed with order confirmation.`,
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
            title: 'Prescription Approved',
            message: `Prescription Approved: Prescription for order #${order.order_id} placed by ${customerName} has been approved by ${storeName}. Awaiting Order Confirmation.`,
            type: 'prescription_approved',
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

    <p>
      The prescription has been approved by the assigned store. ✅
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

    <p style="margin-top:25px;">
      The order will now proceed toward confirmation.
    </p>

    <p style="margin-top:20px;">
      Regards,<br/>
      <strong>Team Pharmato</strong>
    </p>

  </div>
</div>
                                                
                                                                                ${footer}
                                                                            `;
            await sendEmail({ to: superAdminEmail, subject: `Prescription Approved by ${storeName}`, html: superAdminHtml });
          }

          try {
            const superToken = (superAdmin as any).deviceToken;
            if (superToken) {
              await sendPushNotificationWithData({
                token: superToken,
                title: 'Pharmato',
                body: `Prescription Approved: Prescription for order #${order.order_id} placed by ${customerName} has been approved by ${storeName}. Awaiting Order Confirmation.`,
                data: {
                  targetId: order._id.toString(),
                  orderId: order._id.toString(),
                  type: 'prescription_approved',
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
      message: 'Prescription approved successfully',
      data: order,
      mail: mailRes,
      notification: notifRes
    });

  } catch (error) {
    console.error('Error approving prescription:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to approve prescription' },
      { status: 500 }
    );
  }
}
