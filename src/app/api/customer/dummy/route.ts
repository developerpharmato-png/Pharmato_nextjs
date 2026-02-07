import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Admin from '@/models/Admin';
import axios from "axios";
import crypto from 'crypto';
import pako from 'pako';
import moment from "moment-timezone";
import CryptoJS from "crypto-js";
const MARG_KEY = "48TPI07W1R2S";

function decryptMargData(cipherText: string) {
  try {
    const key = CryptoJS.enc.Utf8.parse(MARG_KEY);

    const decrypted = CryptoJS.AES.decrypt(cipherText, key, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7
    });

    // WordArray → Buffer
    const buffer = Buffer.from(
      decrypted.words.flatMap(word => [
        (word >> 24) & 0xff,
        (word >> 16) & 0xff,
        (word >> 8) & 0xff,
        word & 0xff
      ]).slice(0, decrypted.sigBytes)
    );

    // Marg response is UTF-16LE
    const text = buffer.toString("utf16le").trim();

    console.log("🔓 DECRYPTED TEXT:", text);

    if (!text) {
      return { ok: false, reason: "EMPTY_RESPONSE" };
    }

    if (text.startsWith("{")) {
      return { ok: true, data: JSON.parse(text) };
    }

    // Marg business error
    return {
      ok: false,
      reason: "MARG_ERROR",
      message: text
    };

  } catch (err: any) {
    return {
      ok: false,
      reason: "DECRYPT_FAILED",
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
        OrderID: `SB-${Date.now()}`,
        OrderNo: "0",
        // Partycode: "11906405", //General 
        Partycode: "12324265", //Online order
        CustomerID: "306832",
        MargID: "486257",
        Type: "C",
        Sid: "306832",

        ProductCode: "1061746",   // ✅ EXACT as Marg sample
        Quantity: "1",
        Free: "0",

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

        CustName: "Sonu",
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


    const encryptedResponse = response.data;

    const result = decryptMargData(encryptedResponse);

    if (!result.ok) {
        console.log("❌ Marg Error:", result);
        return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json({
        success: true,
        data: result.data
    });

}
