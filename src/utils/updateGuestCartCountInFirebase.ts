import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import GuestCart from '@/models/GuestCart';
import mongoose from 'mongoose';
import { getDb } from '@/utils/firebase.helper';


export async function updateGuestCartCountInFirebase({ guestId, storeId }: { guestId?: string; storeId?: string }) {

    if (!guestId || !storeId) return;

    // Ensure DB connected
    await connectDB();

    // 🔥 LIGHT & FAST aggregation (NO lookup)
    const cartAgg = await GuestCart.aggregate([
        {
            $match: {
                guestId: guestId,
                storeId: new mongoose.Types.ObjectId(storeId)
            }
        },
        {
            $project: {
                _id: 0,
                count: { $size: "$items" }
            }
        }
    ]);

    const count = cartAgg?.[0]?.count || 0;

    // 🔥 Firebase update
    const db = getDb();
    await db
        .ref(`cart/${guestId}/${storeId}`)
        .update({
            count
        });

}
