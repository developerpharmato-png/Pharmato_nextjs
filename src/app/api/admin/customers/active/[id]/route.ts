import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import dbConnect from '@/lib/mongodb';
import { getDb } from '@/utils/firebase.helper';

/**
 * @swagger
 * /api/admin/customers/active/{id}:
 *   put:
 *     summary: Update user's isActive status (admin)
 *     tags:
 *       - Admin-Customer
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer MongoDB ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User active status updated
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
 *       400:
 *         description: Missing required fields
 *       404:
 *         description: User not found
 */
export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params;
    await dbConnect();
    const body = await req.json();
    const { isActive } = body;
    if (typeof isActive !== 'boolean') {
        return NextResponse.json({ success: false, message: 'Missing isActive field', data: null }, { status: 400 });
    }

    // Get user info
    const user = await User.findById(id);
    if (!user) {
        return NextResponse.json({ success: false, message: 'User not found', data: null }, { status: 404 });
    }
    // Set userDeActiveBy to 'admin' when deactivating
    let updateFields: any = { isActive };
    if (isActive === false) {
        updateFields.userDeActiveBy = 'admin';

        // Update paymentStatus in Firebase Realtime Database
        if (user?._id) {
            const db = getDb();
            //Firebase realtime data update
            const firebaseRef = db.ref(`users/${user._id}`);
            await firebaseRef.update({
                isAccountDeActiveByAdmin : true
            });
        }

    } else {
        updateFields.userDeActiveBy = "";

        // Update paymentStatus in Firebase Realtime Database
        if (user?._id) {
            const db = getDb();
            //Firebase realtime data update
            const firebaseRef = db.ref(`users/${user._id}`);
            await firebaseRef.update({
                isAccountDeActiveByAdmin : false
            });
        }

    }
    const userUpdate = await User.findByIdAndUpdate(id, updateFields, { new: true });
    return NextResponse.json({ success: true, message: 'User active status updated', data: userUpdate });
}
