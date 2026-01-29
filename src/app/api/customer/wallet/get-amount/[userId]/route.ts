import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Wallet from '@/models/Wallet';

/**
 * @swagger
 * /api/customer/wallet/get-amount/{userId}:
 *   get:
 *     summary: Get wallet amount for customer
 *     tags:
 *       - Wallet
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User's MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Wallet amount
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     walletAmount:
 *                       type: number
 *                 message:
 *                   type: string
 */

export async function GET(request: NextRequest, context: { params: Promise<{ userId: string }> }) {
    await dbConnect();
    const { userId } = await context.params;
    if (!userId) {
        return NextResponse.json({ success: false, message: 'userId is required' }, { status: 400 });
    }
    const user = await User.findById(userId).select('_id walletAmount');
    if (!user) {
        return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const checkWallet: any = await Wallet.findOne().sort({ createdAt: -1 });
    const createdTime: any = new Date(checkWallet.createdAt);
    const currentTime: any = new Date();
    const diffMs = currentTime - createdTime; // difference in milliseconds
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    let formattedTime = 'a min';

    if (diffMinutes < 60) {
        // Only minutes
        formattedTime = `${diffMinutes} min`;

    } else if (diffMinutes < 1440) { // 24 * 60 = 1440
        // Hours + Minutes
        const hours = Math.floor(diffMinutes / 60);
        const minutes = diffMinutes % 60;
        formattedTime = `${hours} hour ${minutes} min`;

    } else {
        // Days + Hours + Minutes
        const days = Math.floor(diffMinutes / 1440);
        const remainingMinutes = diffMinutes % 1440;
        const hours = Math.floor(remainingMinutes / 60);
        const minutes = remainingMinutes % 60;

        formattedTime = `${days} day ${hours} hour ${minutes} min`;
    }


    return NextResponse.json({
        success: true,
        data: {
            _id: user._id,
            walletAmount: parseFloat(Number(user.walletAmount || 0).toFixed(2)),
            lastUpdate: `Last update ${formattedTime} ago`
        },
        message: 'Wallet amount fetched successfully'
    });

}
