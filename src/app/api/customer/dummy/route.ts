import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Admin from '@/models/Admin';


/**
 * @swagger
 * /api/customer/dummy:
 *   post:
 *     summary: Delete customer account (erase all user data)
 *     tags:
 *       - Customer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 example: "652e1a2b3c4d5e6f7a8b9c0d"
 *     responses:
 *       200:
 *         description: Account deleted
 *       404:
 *         description: User not found
 */
export async function POST(request: NextRequest) {
    await connectDB();

    await User.updateMany(
        {},                 // 🔥 saare documents
        {
            $set: {
                deviceToken: ""
            }
        }
    )

    await Admin.updateMany(
        {},                 // 🔥 saare documents
        {
            $set: {
                deviceToken: ""
            }
        }
    )


    return NextResponse.json({ success: true, message: 'Dummy endpoint executed successfully.' }, { status: 200 });
}
