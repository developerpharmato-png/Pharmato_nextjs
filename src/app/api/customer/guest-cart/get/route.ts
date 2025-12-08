import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import GuestCart from '@/models/GuestCart';

/**
 * @swagger
 * /api/customer/guest-cart/get:
 *   post:
 *     summary: Get guest cart
 *     tags:
 *       - GuestCart
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               guestId:
 *                 type: string
 *                 example: "GUEST_ID"
 *     responses:
 *       200:
 *         description: Guest cart fetched
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 cart:
 *                   $ref: '#/components/schemas/GuestCart'
 */
export async function POST(request: NextRequest) {
    await connectDB();
    let body: any = {};
    try {
        body = await request.json();
    } catch (err) {
        // If no body or invalid JSON, ignore
    }
    const guestId = body.guestId;
    if (!guestId) {
        return NextResponse.json({ success: false, error: 'Guest not authenticated' }, { status: 401 });
    }
    const cart = await GuestCart.findOne({ guestId }).populate({
        path: 'items.medicineId',
        select: '_id name manufacturer isPrescription mrp price images'
    });
    return NextResponse.json({ success: true, cart });
}
