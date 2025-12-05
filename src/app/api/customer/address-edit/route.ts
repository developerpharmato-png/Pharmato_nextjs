import { NextRequest, NextResponse } from 'next/server';
import UserAddress from '@/models/UserAddress';
import dbConnect from '@/lib/mongodb';

/**
 * @swagger
 * /api/customer/address-edit:
 *   put:
 *     summary: Edit customer address
 *     tags:
 *       - Customer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - addressId
 *               - userId
 *               - addressType
 *               - name
 *               # email is optional
 *               - phone
 *               - address
 *             properties:
 *               addressId:
 *                 type: string
 *                 example: "ADDRESS_OBJECT_ID"
 *               userId:
 *                 type: string
 *                 example: "656e1234abcd5678efgh9012"
 *               addressType:
 *                 type: string
 *                 example: "home"
 *               is_primary:
 *                 type: number
 *                 example: 1
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 example: "john@example.com"
 *                 required: false
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *               address:
 *                 type: object
 *                 example: { "street": "123 Main St", "city": "Delhi", "zip": "110001" }
 *     responses:
 *       200:
 *         description: Address updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                 addressList:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Error updating address
 */
export async function PUT(req: NextRequest) {
    await dbConnect();
    const body = await req.json();
    const { addressId, userId, addressType, is_primary, name, email = "", phone, address } = body;
    if (!addressId || !userId || !addressType || !name || !phone || !address) {
        return NextResponse.json({ success: false, message: 'Missing required fields', data: null }, { status: 400 });
    }
    try {
        if (is_primary === 1) {
            await UserAddress.updateMany(
                { userId, is_primary: 1 },
                { $set: { is_primary: 0 } }
            );
        }
        const billing = { name, email, phone, address };
        const updated = await UserAddress.findByIdAndUpdate(addressId, {
            addressType,
            is_primary: is_primary || 0,
            name,
            email,
            phone,
            address,
            billing
        }, { new: true });
        const addressList = await UserAddress.find({ userId });
        return NextResponse.json({ success: true, message: 'Address updated successfully', data: updated, addressList });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: 'Error updating address', error: error.message });
    }
}
