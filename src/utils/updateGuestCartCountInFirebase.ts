import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import GuestCart from '@/models/GuestCart';
import mongoose from 'mongoose';
import { getDb } from '@/utils/firebase.helper';


export async function updateGuestCartCountInFirebase({ guestId, storeId }: { guestId?: string; storeId?: string }) {
    await connectDB();

    // AGGREGATE PIPELINE (FULL GUEST CART WITH MEDICINE DETAILS, SELECTED FIELDS)
    const cartAgg = await GuestCart.aggregate([
        {
            $match: {
                guestId: guestId,
                storeId: new mongoose.Types.ObjectId(storeId)
            }
        },
        {
            $lookup: {
                from: "medicines",
                localField: "items.medicineId",
                foreignField: "_id",
                as: "medicines"
            }
        }
    ]);

    const cart = cartAgg?.[0] || null;

    // Update paymentStatus in Firebase Realtime Database
    if (cart && cart.items) {

        const db = getDb();
        await db
            .ref(`cart/${guestId}/${storeId}`)
            .update({
                count: cart.items.length
            });

    }else{

        const db = getDb();
        await db
            .ref(`cart/${guestId}/${storeId}`)
            .update({
                count: 0
            });

    }


}
