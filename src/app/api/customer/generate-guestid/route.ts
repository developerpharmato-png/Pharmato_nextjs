/**
 * @swagger
 * /api/customer/generate-guestid:
 *   get:
 *     summary: Generate a unique guestId for guest users
 *     tags:
 *       - Customer
 *     responses:
 *       200:
 *         description: Returns a new guestId
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 guestId:
 *                   type: string
 */
import { NextRequest, NextResponse } from 'next/server';

function generateGuestId() {
    const random = Math.random().toString(36).substring(2, 10); // 8 char random
    const time = Date.now();
    return `guest-${random}-${time}`;
}

export async function GET(req: NextRequest) {
    const guestId = generateGuestId();
    return NextResponse.json({
        success: true,
        message: 'Guest ID generated successfully',
        guestId
    });
}
