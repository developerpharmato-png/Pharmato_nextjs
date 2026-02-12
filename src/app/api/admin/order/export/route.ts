import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import User from '@/models/User';
import '@/models/Medicine';
import { log } from '@/lib/logger';
import * as xlsx from 'xlsx';
import { format } from 'date-fns';

export async function POST(req: NextRequest) {
    await dbConnect();
    try {
        const body = await req.json();
        log.info('AdminOrderExport: body', body);

        const {
            startDate, // dd:MM:yyyy or ISO
            endDate,   // dd:MM:yyyy or ISO
            search = '',
            customerId,
            storeId,
            prescription_status,
            order_status
        } = body || {};

        function parseDateFlexible(ds: any) {
            if (!ds) return null;
            if (typeof ds !== 'string') return null;
            const ddmmyyyy = /^\s*(\d{2})[:\-\/](\d{2})[:\-\/](\d{4})\s*$/;
            const ymd = /^\s*(\d{4})-(\d{2})-(\d{2})\s*$/;
            let m = ds.match(ddmmyyyy);
            if (m) {
                const day = Number(m[1]);
                const month = Number(m[2]) - 1;
                const year = Number(m[3]);
                return new Date(year, month, day);
            }
            m = ds.match(ymd);
            if (m) {
                const year = Number(m[1]);
                const month = Number(m[2]) - 1;
                const day = Number(m[3]);
                return new Date(year, month, day);
            }
            const parsed = new Date(ds);
            if (isNaN(parsed.getTime())) return null;
            return parsed;
        }

        const query: any = {};

        if (customerId && typeof customerId === 'string') query.userId = customerId;
        if (prescription_status && typeof prescription_status === 'string') query.prescription_status = prescription_status;
        if (order_status && typeof order_status === 'string') query.order_status = order_status;

        // date range handling: if startDate/endDate provided use them, else ignore
        if (startDate || endDate) {
            const startParsed = parseDateFlexible(startDate) || new Date(0);
            const endParsed = parseDateFlexible(endDate) || new Date();
            // Ensure end includes the full day when a date-only string is passed
            if ((typeof endDate === 'string' && endDate.trim().length === 10) || endParsed.getHours() === 0 && endParsed.getMinutes() === 0 && endParsed.getSeconds() === 0) {
                endParsed.setHours(23, 59, 59, 999);
            }
            query.createdAt = { $gte: startParsed, $lte: endParsed };
        }

        // basic search similar to list route
        if (search && String(search).trim()) {
            const regex = { $regex: search, $options: 'i' };
            const orConditions: any[] = [{ order_id: regex }, { payment_id: regex }];
            try {
                const matchingUsers = await User.find({ $or: [{ name: regex }, { email: regex }, { mobile: regex }] }).select('_id').lean();
                const userIds = Array.isArray(matchingUsers) ? matchingUsers.map(u => u._id) : [];
                if (userIds.length) orConditions.push({ userId: { $in: userIds } });
            } catch (e: any) {
                log.error('AdminOrderExport: user lookup failed', e?.message || e);
            }
            query.$or = orConditions;
        }

        // storeId intentionally not enforced here (matching list behavior)

        const orders = await Order.find(query)
            .sort({ createdAt: -1 })
            .populate({ path: 'userId', select: '_id name email mobile' })
            .populate({ path: 'medicineId', select: '_id name price mrp' })
            .lean();

        // Map rows for Excel
        const rows = (Array.isArray(orders) ? orders : []).map((o: any) => {
            const medicines = Array.isArray(o.medicineId) ? o.medicineId.map((m: any) => m?.name || '').join(', ') : '';
            const quantities = Array.isArray(o.medicineQuantity) ? o.medicineQuantity.map((q: any) => q.quantity || '').join(', ') : '';
            const deliveredAddr = o.deliveredAddress || {};
            const calculationData = o.calculationData || {};
            const deliveryAddressCity = (deliveredAddr?.address?.city || '') + (deliveredAddr?.address?.state ? ', ' + deliveredAddr.address.state : '') + (deliveredAddr?.address?.pinCode ? ' - ' + deliveredAddr.address.pinCode : '');
            return {
                "Order ID": o.order_id || '',
                "Payment ID": o.payment_id || '',
                // "Customer Name": o.userId?.name || '',
                // "Customer Email": o.userId?.email || '',
                // "Customer Mobile": o.userId?.mobile || '',
                "Customer Name": deliveredAddr?.name || '',
                "Customer Email": deliveredAddr?.email || '',
                "Customer Phone": deliveredAddr?.phone || '',
                // "Delivery Address": deliveryAddressCity || '',
                "Medicines": medicines,
                "Quantities": quantities,
                "Total Order Amount": o.total_order_amount || 0,
                "Actual Amount": o.actual_amount || 0,
                "Discount": o.discount || 0,
                "Delivery Charges": calculationData.deliveryFee || 0,
                "Payment Status": o.payment_status || '',
                "Order Status": o.order_status || '',
                "Order Date": o.createdAt ? format(new Date(o.createdAt), 'dd-MM-yyyy') : ''
            };
        });

        const worksheet = xlsx.utils.json_to_sheet(rows);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, 'orders');

        const buf = xlsx.write(workbook, { bookType: 'xlsx', type: 'buffer' });
        // Convert Node Buffer to ArrayBuffer for Response
        const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

        return new NextResponse(arrayBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="orders_export_${Date.now()}.xlsx"`
            }
        });

    } catch (error: any) {
        log.error('AdminOrderExport: error', error?.message || error);
        return new Response(JSON.stringify({ success: false, message: 'Failed to export orders', error: error?.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}
