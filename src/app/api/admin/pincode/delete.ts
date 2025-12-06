export async function DELETE(req: NextRequest) {
	await dbConnect();
	const { id } = await req.json();
	if (!id) {
		return NextResponse.json({ success: false, message: 'id is required' }, { status: 400 });
	}
	const pin = await Pincode.findByIdAndDelete(id);
	if (!pin) {
		return NextResponse.json({ success: false, message: 'Pincode not found' }, { status: 404 });
	}
	return NextResponse.json({ success: true, message: 'Pincode deleted' });
}
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Pincode from '@/models/Pincode';

/**
 * @swagger
 * /api/admin/pincode/delete:
 *   delete:
 *     summary: Delete a pincode
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
 *     responses:
 *       200:
 *         description: Pincode deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
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

