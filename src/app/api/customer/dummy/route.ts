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

    // const payload = {
    //     OrderID: "",
    //     OrderNo: `7000`,
    //     // Partycode: "STACjn", //Online order
    //     // CustomerID: "11906405",//12324265
    //     Partycode: "APP   ", //Online order
    //     CustomerID: "12324265",//12324265
    //     MargID: "486257",
    //     Type: "C",
    //     Sid: "306832",
    //     ProductCode: '1061705,1061765',
    //     Quantity: '1,1',
    //     Free: "0,0",

    //     Lat: "",
    //     Lng: "",
    //     Address: "",
    //     GpsID: "0",
    //     UserType: "1",
    //     Points: "0.00",

    //     Discounts: "1",
    //     Transport: "",
    //     Delivery: "",

    //     Bankname: "",
    //     BankAdd1: "",
    //     BankAdd2: "",

    //     shipname: "",
    //     shipAdd1: "",
    //     shipAdd2: "",
    //     shipAdd3: "",

    //     paymentmode: "1",
    //     paymentmodeAmount: "0",
    //     payment_remarks: "",
    //     order_remarks: "order place",

    //     CustName: "Sunil",
    //     CustMobile: "7470376772",

    //     DoctorName: "",
    //     DoctorMobile: "",

    //     CompanyCode: "PharmatoInd2",
    //     OrderFrom: "PharmatoInd2"
    // };

    // const response = await axios.post(
    //     "https://corporate.margerp.com/api/eOnlineData/InsertOrderDetailB2C",
    //     payload,
    //     { headers: { "Content-Type": "application/json" } }
    // );

    // console.log("📥 RAW:", response.data);

    // const result = decryptMargData(response.data);

    // console.log("$$$$$$$$$$$result$$$$$$$$$$$$$$", result);


    // latest 3 records ki id lo


    const superAdminRole = await (await import('@/models/Role')).default.findOne({ name: /superadmin/i });
    if (superAdminRole && superAdminRole._id) {
        const superAdmins = await Admin.find({ roleId: superAdminRole._id }).lean();
        for (const superAdmin of superAdmins) {

            try {
                const superToken = (superAdmin as any).deviceToken;
                if (superToken) {
                    await sendPushNotificationWithData({
                        token: superToken,
                        title: 'Order Received',
                        body: "dummy notification aya kya",
                        data: {}
                    });
                }
            } catch (err) {
                console.error('Failed to send push notification to superadmin:', err);
            }

        }
    }


    return NextResponse.json({
        success: true,
        // data: result
    });

}
