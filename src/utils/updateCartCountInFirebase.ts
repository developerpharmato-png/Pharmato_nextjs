
import dbConnect from '@/lib/mongodb';
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import Cart from "@/models/Cart";
import { getDb } from '@/utils/firebase.helper';

export async function updateCartCountInFirebase({ userId, storeId }: { userId?: string; storeId?: string }) {

    await dbConnect();

    // Get cart with medicine details, store-based
    const cartAgg = await Cart.aggregate([
        {
            $match: {
                userId: new mongoose.Types.ObjectId(userId),
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
            .ref(`cart/${userId}/${storeId}`)
            .update({
                count: cart.items.length
            });

    }else{

        const db = getDb();
        await db
            .ref(`cart/${userId}/${storeId}`)
            .update({
                count: 0
            });

    }

}