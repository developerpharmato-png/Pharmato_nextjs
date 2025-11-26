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
    const { pincode, isActive = true } = await req.json();
    if (!pincode || typeof pincode !== 'string') {
        return NextResponse.json({ success: false, message: 'pincode is required' }, { status: 400 });
    }
    const exists = await Pincode.findOne({ pincode });
    if (exists) {
        return NextResponse.json({ success: false, message: 'Pincode already exists' }, { status: 409 });
    }
    const pin = await Pincode.create({ pincode, isActive });
    return NextResponse.json({ success: true, data: pin });
}

