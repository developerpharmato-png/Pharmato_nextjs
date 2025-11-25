import { NextRequest, NextResponse } from 'next/server';
import UserAddress from '@/models/UserAddress';
import dbConnect from '@/lib/mongodb';

/**
 * @swagger
 * /api/customer/address-delete:
 *   delete:
 *     summary: Delete customer address
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
 *             properties:
 *               addressId:
 *                 type: string
 *                 example: "ADDRESS_OBJECT_ID"
 *               userId:
 *                 type: string
 *                 example: "656e1234abcd5678efgh9012"
 *     responses:
 *       200:
 *         description: Address deleted successfully
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
 *       400:
 *         description: Error deleting address
 */
export async function DELETE(req: NextRequest) {
    await dbConnect();
    const body = await req.json();
    const { addressId, userId } = body;
    if (!addressId || !userId) {
        return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }
    try {
        await UserAddress.findByIdAndDelete(addressId);
        const addressList = await UserAddress.find({ userId });
        return NextResponse.json({ success: true, message: 'Address deleted successfully', addressList });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: 'Error deleting address', error: error.message });
    }
}
