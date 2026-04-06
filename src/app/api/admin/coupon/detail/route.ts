import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Coupon from '@/models/Coupon';
import User from '@/models/User';

/**
 * @swagger
 * /api/admin/coupon/detail:
 *   get:
 *     summary: Get coupon details by ID
 *     tags:
 *       - Admin-Coupon
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Coupon ObjectId
 *     responses:
 *       200:
 *         description: Coupon details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid or missing id
 *       404:
 *         description: Coupon not found
 */

export async function GET(req: NextRequest) {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ success: false, message: 'Coupon id is required' }, { status: 400 });
    }

    try {
        // const coupon = await Coupon.findById(id);
        // if (!coupon) {
        //     return NextResponse.json({ success: false, message: 'Coupon not found' }, { status: 404 });
        // }
        // return NextResponse.json({ success: true, data: coupon });


        const coupon = await Coupon.findById(id);

        if (!coupon) {
            return NextResponse.json({ success: false, message: 'Coupon not found' }, { status: 404 });
        }

        // 🔥 extract userIds
        const userIds = coupon.usersOrGuestsUsed
            .map((u : any) => u.userId)
            .filter(Boolean);

        // 🔥 get users
        const users = await User.find({
            _id: { $in: userIds }
        }).select('name email mobile');

        // 🔥 map users
        const usersMap : Record<string, any> = {};
        users.forEach((u : any) => {
            usersMap[u._id.toString()] = u;
        });

        // 🔥 merge data
        const finalUsers = coupon.usersOrGuestsUsed.map((u : any) => ({
            userId: u.userId,
            name: usersMap[u.userId]?.name || null,
            email: usersMap[u.userId]?.email || null,
            mobile: usersMap[u.userId]?.mobile || null,
            uses: u.uses
        }));

        return NextResponse.json({
            success: true,
            data: {
                ...coupon.toObject(),
                usersOrGuestsUsed: finalUsers
            }
        });


    } catch (error) {
        return NextResponse.json({ success: false, message: 'Invalid coupon id' }, { status: 400 });
    }
}
