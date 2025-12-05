import { NextRequest, NextResponse } from 'next/server';
import UserAddress from '@/models/UserAddress';
import dbConnect from '@/lib/mongodb';

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
        const addressList = await UserAddress.find({ userId }).lean();
        // For each address, find stores with matching servicePinCodes
        for (const address of addressList) {
            const pinCode = address?.address?.pinCode || address?.address?.pincode;
            if (pinCode) {
                const storeList = await (await import('@/models/Store')).default.find({ servicePinCodes: pinCode, status: 1 }).lean();
                address.storeList = storeList;
            } else {
                address.storeList = [];
            }
        }
        return NextResponse.json({ success: true, message: 'Address list fetched successfully', addressList });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: 'Error fetching address list', error: error.message });
    }
}
