import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Setting from '@/models/Setting';

/**
 * @swagger
 * /api/customer/wallet/get/recharge-wallet-data:
 *   post:
 *     summary: Get wallet recharge calculation data
 *     tags:
 *       - Wallet
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 1000
 *     responses:
 *       200:
 *         description: Calculation data for wallet recharge
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                 razorPayKeyId:
 *                   type: string
 *                 razorPaySecretKey:
 *                   type: string
 */

export async function POST(request: NextRequest) {
    await dbConnect();
    const body = await request.json();
    const { amount } = body;
    if (typeof amount !== 'number' || amount <= 0) {
        return NextResponse.json({ success: false, error: 'amount must be a positive number' }, { status: 400 });
    }

    const settings = await Setting.find().lean();
    const walletCalculationData: any = {};

    for (const setting of settings) {
        if (setting.type === 'gst') {
            walletCalculationData.gstInPercent = Number(setting.data);
        }
        if (setting.type === 'platform fee') {
            walletCalculationData.platformFeeInRupees = Number(setting.data);
        }
        if (setting.type === 'platform fee gst') {
            walletCalculationData.platformFeeGstInPercent = Number(setting.data);
        }
        if (setting.type === 'razorPay comission') {
            walletCalculationData.razorPayCommissionInPercent = Number(setting.data);
        }
        if (setting.type === 'razorPay gst') {
            walletCalculationData.razorPayCommissionGstInPercent = Number(setting.data);
        }
    }

    walletCalculationData.amount = Number(amount);

    const razorPayCommissionAmount = (amount * (walletCalculationData.razorPayCommissionInPercent || 0)) / 100;
    const razorPayCommissionGstAmount = (razorPayCommissionAmount * (walletCalculationData.razorPayCommissionGstInPercent || 0)) / 100;

    walletCalculationData.razorPayCommissionAmount = razorPayCommissionAmount;
    walletCalculationData.razorPayCommissionGstAmount = razorPayCommissionGstAmount;
    walletCalculationData.totalAmountRazorPayCharged = razorPayCommissionAmount + razorPayCommissionGstAmount;

    const totalAmount = amount + razorPayCommissionAmount + razorPayCommissionGstAmount;
    walletCalculationData.totalAmount = totalAmount;

    return NextResponse.json({
        success: true,
        message: 'Get wallet calculation data successfully',
        data: walletCalculationData
    });
    
}
