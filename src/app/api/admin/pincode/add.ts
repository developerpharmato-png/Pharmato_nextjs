import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Pincode from '@/models/Pincode';

/**
 * @swagger
 * /api/admin/pincode/add:
 *   post:
 *     summary: Add a new pincode
 *     tags:
 *       - Pincode
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pincode:
 *                 type: string
 *                 description: Pincode value
 *               isActive:
 *                 type: boolean
 *                 description: Is pincode active
 *                 default: true
 *     responses:
 *       200:
 *         description: Pincode added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Pincode'
 *       400:
 *         description: Missing or invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       409:
 *         description: Pincode already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */

export async function POST(req: NextRequest) {
    await dbConnect();
    const body = await req.json();
    const pincodes = body.pincodes || body.data?.pincodes; // Support both formats

    if (!Array.isArray(pincodes) || pincodes.length === 0) {
        return NextResponse.json({ success: false, message: 'pincodes array is required' }, { status: 400 });
    }

    const invalidPincodes = pincodes.filter(pincode => typeof pincode !== 'string' || !/^([1-9][0-9]{5})$/.test(pincode));
    if (invalidPincodes.length > 0) {
        return NextResponse.json({
            success: false,
            message: `Invalid pincodes: ${invalidPincodes.join(', ')}`
        }, { status: 400 });
    }

    const existingPincodes = await Pincode.find({ pincode: { $in: pincodes } });
    const existingPincodeValues = existingPincodes.map(pin => pin.pincode);

    const newPincodes = pincodes.filter(pincode => !existingPincodeValues.includes(pincode));
    if (newPincodes.length === 0) {
        return NextResponse.json({ success: false, message: 'All pincodes already exist' }, { status: 409 });
    }

    const createdPincodes = await Pincode.insertMany(newPincodes.map(pincode => ({ pincode, isActive: true })));

    return NextResponse.json({
        success: true,
        data: createdPincodes
    });
}

