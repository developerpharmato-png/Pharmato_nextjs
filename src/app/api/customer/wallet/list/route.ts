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

    const { userId } = await req.json();

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return NextResponse.json(
            { status: false, message: 'Invalid userId' },
            { status: 400 }
        );
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const walletList = await Wallet.aggregate([
        // 1️⃣ Match user
        {
            $match: {
                userId: userObjectId
            }
        },

        // 2️⃣ Latest orders first
        {
            $sort: { createdAt: -1 }
        },

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

