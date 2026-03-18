import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Admin from '@/models/Admin';
import axios from "axios";
import crypto from 'crypto';
import pako from 'pako';
import moment from "moment-timezone";
import CryptoJS from "crypto-js";
import zlib from "zlib";
import Marg from '@/models/Marg';
import { sendPushNotificationWithData } from '@/utils/firebase.helper';

const MARG_KEY = "48TPI07W1R2S";

export function decryptMargData(data: string) {
    const buffer = Buffer.from(data, "base64");

    const result = zlib.inflateRawSync(buffer);

    // Buffer → string
    const text = result.toString("utf8");

    // Remove BOM
    const cleaned = text.replace(/^\uFEFF/, "");

    // Convert to JSON object
    return JSON.parse(cleaned);
}

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

await Admin.updateMany(
  {}, 
  { $set: { deviceToken: "" } }
);

    return NextResponse.json({
        success: true,
        // data: result
    });

}
