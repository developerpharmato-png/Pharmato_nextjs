import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Pincode from '@/models/Pincode';
import Store from '@/models/Store';

/**
 * @swagger
 * /api/customer/pincode-check:
 *   post:
 *     summary: Check if pincode is available (active)
 *     tags:
 *       - Customer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pincode:
 *                 type: string
 *                 example: "465226"
 *     responses:
 *       200:
 *         description: Pincode is available
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Pincode not available
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
    const { pincode } = await req.json();
    if (!pincode) {
        return NextResponse.json({ success: false, message: 'pincode is required' }, { status: 400 });
    }

    const pin = await Store.findOne({ servicePinCodes: { $in: [pincode] }, status: 1 }).lean();

    if (pin) {
        return NextResponse.json({ success: true, message: 'Area is serviceable.' });
    } else {
        return NextResponse.json({ success: false, message: 'Area is unserviceable.' }, { status: 404 });
    }
}
