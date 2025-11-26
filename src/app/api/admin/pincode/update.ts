import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Pincode from '@/models/Pincode';

/**
 * @swagger
 * /api/admin/pincode/update:
 *   put:
 *     summary: Update a pincode
 *     tags:
 *       - Pincode
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 description: Pincode document ID
 *               pincode:
 *                 type: string
 *                 description: Pincode value
 *               isActive:
 *                 type: boolean
 *                 description: Is pincode active
 *     responses:
 *       200:
 *         description: Pincode updated successfully
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
 *       404:
 *         description: Pincode not found
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

export async function PUT(req: NextRequest) {
    await dbConnect();
    const { id, pincode, isActive } = await req.json();
    if (!id) {
        return NextResponse.json({ success: false, message: 'id is required' }, { status: 400 });
    }
    if (!pincode || typeof pincode !== 'string') {
        return NextResponse.json({ success: false, message: 'pincode is required' }, { status: 400 });
    }
    const pin = await Pincode.findByIdAndUpdate(id, { pincode, isActive }, { new: true });
    if (!pin) {
        return NextResponse.json({ success: false, message: 'Pincode not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: pin });
}

