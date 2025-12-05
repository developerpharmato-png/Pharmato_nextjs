import { NextRequest, NextResponse } from 'next/server';
import UserAddress from '@/models/UserAddress';
import dbConnect from '@/lib/mongodb';

/**
 * @swagger
 * /api/customer/address-detail:
 *   post:
 *     summary: Get customer address detail
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
 *                 description: The address ID
 *               userId:
 *                 type: string
 *                 description: The user ID
 *     responses:
 *       200:
 *         description: Address detail fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                       example: "john@example.com"
 *                       required: false
 *       400:
 *         description: Missing required fields or error
 */

export async function POST(request: NextRequest) {
    await dbConnect();
    const { addressId, userId } = await request.json();
    if (!addressId || !userId) {
        return NextResponse.json({ success: false, message: 'Missing addressId or userId' }, { status: 400 });
    }
    try {
        const address = await UserAddress.findOne({ _id: addressId, userId });
        if (!address) {
            return NextResponse.json({ success: false, message: 'Address not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: address });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: 'Error fetching address detail', error: error.message }, { status: 400 });
    }
}
