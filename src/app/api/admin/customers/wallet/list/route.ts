import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';
import moment from 'moment-timezone';
import Wallet from '@/models/Wallet';

/**
 * @swagger
 * /api/customer/wallet/list:
 *   post:
 *     summary: Get list of orders for a customer
 *     tags:
 *       - Wallet
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User's ObjectId
 *     responses:
 *       200:
 *         description: List of orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Missing or invalid input
 */

export async function POST(req: NextRequest) {
    await dbConnect();

    const { userId, limit = 10, offset = 0 } = await req.json();

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return NextResponse.json(
            { status: false, message: 'Invalid userId' },
            { status: 400 }
        );
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Ensure limit and offset are numbers and safe
    const safeLimit = Math.max(1, Math.min(Number(limit) || 10, 100));
    const safeOffset = Math.max(0, Number(offset) || 0);

    const walletList = await Wallet.aggregate([
        { $match: { userId: userObjectId } },
        { $sort: { createdAt: -1 } }, // Newest first
        { $skip: safeOffset },
        { $limit: safeLimit },
    ]);

    for (const wallet of walletList) {
        if (wallet.createdAt) {
            wallet.createdAt = moment(wallet.createdAt)
                .tz('Asia/Kolkata')
                .format('MMM D, YYYY HH:mm z');
        }
    }

    return NextResponse.json({ status: true, data: walletList });
}

