import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { sendEmail } from '@/utils/sendEmail';

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

            // Get store and admin manager
            let storeName = '';
            let adminName = '';
            let adminRoleName = '';
            let customerName = 'Customer';
            let userEmail = '';
            let storeId = (orderDoc as any).storeId;

            const deliveredAddr: any = orderDoc.deliveredAddress || null;
            if (deliveredAddr) {
                customerName = deliveredAddr?.name || 'Customer';
                userEmail = deliveredAddr?.email || '';
            }
            if (storeId) {
                const store = await Store.findById(storeId).lean();
                if (store && typeof store === 'object' && !Array.isArray(store)) {
                    storeName = store.name || '';
                    if ('adminManagerId' in store && store.adminManagerId) {
                        const admin = await Admin.findById(store.adminManagerId).lean();
                        if (admin && typeof admin === 'object' && !Array.isArray(admin)) {
                            adminName = admin.name || '';
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
                                message: `Customer ${customerName} has re-uploaded prescription for order ${(orderDoc as any).order_id} in store ${storeName}.`,
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
                            message: `Customer ${customerName} has re-uploaded prescription for order ${(orderDoc as any).order_id} in store ${storeName}.`,
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
                    }
                }
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
