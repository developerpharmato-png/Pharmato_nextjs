import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Pincode from '@/models/Pincode';

/**
 * @swagger
 * /api/admin/pincode/list:
 *   get:
 *     summary: List all pincodes
 *     tags:
 *       - Pincode
 *     responses:
 *       200:
 *         description: List of pincodes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Pincode'
 */

export async function GET() {
    await dbConnect();
    const pincodes = await Pincode.find().lean();
    return NextResponse.json({ success: true, data: pincodes });
}
