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

const MARG_KEY = "48TPI07W1R2S";

export function decryptMargData(cipherText: string) {

    // 🔴 C# reference se PROVEN:
    // Short response = NOT encrypted (ACK)
    if (!cipherText || cipherText.length < 150) {
        return {
            ok: true,
            data: {
                status: "ACK",
                message: "Order accepted by Marg"
            }
        };
    }

    try {
        // Step 1️⃣ Base64 decode (Convert.FromBase64String)
        const encryptedData = Buffer.from(cipherText, "base64");

        // Step 2️⃣ KeyBytes (exact C# logic)
        const keyBytes = Buffer.alloc(16);
        Buffer.from(MARG_KEY, "utf8").copy(keyBytes);

        const ivBytes = keyBytes; // C# me IV = Key

        // Step 3️⃣ AES-128-CBC decrypt
        const decipher = crypto.createDecipheriv(
            "aes-128-cbc",
            keyBytes,
            ivBytes
        );
        decipher.setAutoPadding(true);

        const decryptedBytes = Buffer.concat([
            decipher.update(encryptedData),
            decipher.final()
        ]);

        // Step 4️⃣ UTF8 string (Encoding.UTF8.GetString)
        const decryptedText = decryptedBytes.toString("utf8");

        // Step 5️⃣ Base64 decode (Convert.FromBase64String)
        const compressedBytes = Buffer.from(decryptedText, "base64");

        // Step 6️⃣ DeflateStream decompress
        const output = zlib.inflateRawSync(compressedBytes);

        const finalText = output.toString("utf8").trim();

        return {
            ok: true,
            data: JSON.parse(finalText)
        };

    } catch (err: any) {
        return {
            ok: false,
            reason: "MARG_DECRYPT_FAIL",
            error: err.message
        };
    }
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

    const payload = {
        OrderID: "",
        OrderNo: `1007`,
        Partycode: "STACjn", //Online order
        CustomerID: "11906405",//12324265
        // Partycode: "APP   ", //Online order
        // CustomerID: "12324265",//12324265
        MargID: "486257",
        Type: "C",
        Sid: "306832",

        // ProductCode: "1061746",   // ✅ EXACT as Marg sample
        ProductCode: "1063348,1061746,1080900",   // ✅ EXACT as Marg sample
        Quantity: "1,1,2",
        Free: "0,0,0",

        Lat: "",
        Lng: "",
        Address: "",
        GpsID: "0",
        UserType: "1",
        Points: "0.00",

        Discounts: "1",
        Transport: "",
        Delivery: "",

        Bankname: "",
        BankAdd1: "",
        BankAdd2: "",

        shipname: "",
        shipAdd1: "",
        shipAdd2: "",
        shipAdd3: "",

        paymentmode: "1",
        paymentmodeAmount: "0",
        payment_remarks: "",
        order_remarks: "order place",

        CustName: "Sunil",
        CustMobile: "7470376772",

        DoctorName: "",
        DoctorMobile: "",

        CompanyCode: "PharmatoInd2",
        OrderFrom: "PharmatoInd2"
    };

    const response = await axios.post(
        "https://corporate.margerp.com/api/eOnlineData/InsertOrderDetailB2C",
        payload,
        { headers: { "Content-Type": "application/json" } }
    );

    console.log("📥 RAW:", response.data);

    const result = decryptMargData(response.data);

    console.log("$$$$$$$$$$$result$$$$$$$$$$$$$$", result);

    if (!result.ok) {
        console.log("❌ Marg Error:", result);
        return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json({
        success: true,
        data: result.data
    });

}
