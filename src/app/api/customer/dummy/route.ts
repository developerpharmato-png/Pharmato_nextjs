import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Admin from '@/models/Admin';
import axios from "axios";
import CryptoJS from "crypto-js";


const MARG_KEY = "5Z6HWPTG3O4K";

// function decryptMargData(cipherText: string) {
//     const key = CryptoJS.enc.Utf8.parse(MARG_KEY);

//     try {
//         const bytes = CryptoJS.AES.decrypt(cipherText, key, {
//             mode: CryptoJS.mode.ECB,
//             padding: CryptoJS.pad.Pkcs7
//         });

//         const decrypted = bytes.toString(CryptoJS.enc.Utf8);

//         if (!decrypted || decrypted.trim() === "") {
//             throw new Error("Empty decrypted text");
//         }

//         console.log("🔓 DECRYPTED TEXT:", decrypted);

//         return {
//             ok: true,
//             text: decrypted
//         };
//     } catch (err) {
//         // ❌ Marg rejection → encrypted token only
//         console.log("❌ Marg rejected (non-json encrypted token)");

//         return {
//             ok: false,
//             reason: "MARG_REJECTED_REQUEST",
//             raw: cipherText
//         };
//     }
// }

function decryptMargData(cipherText: string) {
    const key = CryptoJS.enc.Utf8.parse(MARG_KEY);

    const bytes = CryptoJS.AES.decrypt(cipherText, key, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
    });

    const decrypted = bytes.toString(CryptoJS.enc.Utf8);

    console.log("🔓 DECRYPTED TEXT:", decrypted);

    if (!decrypted || !decrypted.trim().startsWith("{")) {
        return {
            ok: false,
            reason: "MARG_REJECTED_REQUEST",
            raw: cipherText
        };
    }

    return {
        ok: true,
        text: decrypted
    };
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
        OrderNo: "",   // unique
        Partycode: "AEEV",
        CustomerID: "6732867",
        MargID: "230965",
        Type: "S",
        Sid: "161613",

        ProductCode: "1061583",   // ✅ EXACT as Marg sample
        Quantity: "1",
        Free: "0",

        Lat: "",
        Lng: "",
        Address: "",
        GpsID: "0",
        UserType: "1",
        Points: "0.00",

        Discounts: "0",
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

        DoctorName: "DR.BHATT",
        DoctorMobile: "9015030736",

        CompanyCode: "RakeshApi2",
        OrderFrom: "RakeshApi2"
    };

    const response = await axios.post(
        "https://corporate.margerp.com/api/eOnlineData/InsertOrderDetailB2C",
        payload,
        { headers: { "Content-Type": "application/json" } }
    );

    console.log("📥 RAW:", response.data);

    const result : any = decryptMargData(response.data);

    if (!result.ok) {
        return NextResponse.json(
            {
                success: false,
                message: "Marg rejected order (master / mapping issue)",
                debug: result
            },
            { status: 400 }
        );
    }

    let json;
    try {
        json = JSON.parse(result.text);
    } catch {
        return NextResponse.json({
            success: false,
            message: "Marg success but non-JSON response",
            raw: result.text
        });
    }

    return NextResponse.json({ success: true, data: json });


}
