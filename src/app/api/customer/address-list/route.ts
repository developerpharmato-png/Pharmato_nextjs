import { NextRequest, NextResponse } from 'next/server';
import UserAddress from '@/models/UserAddress';
import Store from '@/models/Store';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import { Types } from 'mongoose';

/**
 * @swagger
 * /api/customer/address-list:
 *   post:
 *     summary: List all customer addresses
 *     tags:
 *       - Customer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "656e1234abcd5678efgh9012"
 *     responses:
 *       200:
 *         description: Address list fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 addressList:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       email:
 *                         type: string
 *                         example: "john@example.com"
 *                         required: false
 *       400:
 *         description: Error fetching address list
 */
export async function POST(req: NextRequest) {
    await dbConnect();
    const { userId } = await req.json();
    if (!userId) {
        return NextResponse.json({ success: false, message: 'Missing userId' }, { status: 400 });
    }
    try {
        const addressList = await UserAddress.find({ userId }).sort({ createdAt: -1 }).lean();
        // For each address, find stores with matching servicePinCodes
        for (const address of addressList) {
            const rawPinCode = address?.address?.pinCode;
            const pinCode = typeof rawPinCode === 'string' ? rawPinCode.trim() : '';
            if (pinCode.length > 0) {
                const store = await Store.findOne({ servicePinCodes: { $in: [pinCode] }, status: 1 }).lean();
                address.storeList = store ? [store] : [];
            } else {
                address.storeList = [];
            }

            const recentOrder = await Order.findOne({
                userId: new Types.ObjectId(userId)
            })
                .sort({ createdAt: -1 })
                .lean();

            if (recentOrder && !Array.isArray(recentOrder)) {
                if (recentOrder?.deliveredAddress?._id?.toString() === String(address._id)) {
                    address.lastUsed = true;
                } else {
                    address.lastUsed = false;
                }
            } else {
                address.lastUsed = false;
            }

        }

        // // Filter out addresses that have no matching store
        // const filteredAddressList = addressList.filter((a: any) => Array.isArray(a.storeList) && a.storeList.length > 0);

        return NextResponse.json({ success: true, message: 'Address list fetched successfully', addressList: addressList });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: 'Error fetching address list', error: error.message });
    }
}
