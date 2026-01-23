
import dbConnect from '@/lib/mongodb';
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import Cart from "@/models/Cart";
import { getDb } from '@/utils/firebase.helper';
import connectDB from '@/lib/mongodb';
// 🔥 Firebase update
const db = getDb();

export async function updateCartCountInFirebase({ userId, storeId }: { userId?: string; storeId?: string }) {

    if (!userId || !storeId) return;

    // Ensure DB connected (idempotent, safe)
    // await dbConnect();

    await connectDB();

    // 🔥 LIGHT & FAST aggregation (NO lookup)
    const cartAgg = await Cart.aggregate([
        {
            $match: {
                userId: new mongoose.Types.ObjectId(userId),
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

    await db
        .ref(`cart/${userId}/${storeId}`)
        .update({
            count
        });

}