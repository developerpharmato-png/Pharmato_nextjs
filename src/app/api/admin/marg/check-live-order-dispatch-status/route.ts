import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import crypto from 'crypto';
import pako from 'pako';
import Medicine from '@/models/Medicine';
import mongoose from 'mongoose';
import Marg from '@/models/Marg';
import moment from "moment-timezone";
import Order from '@/models/Order';

// Decrypt AES-128-CBC (no padding)
function decryptAES(encryptedBase64: string, key: string): Buffer {
    const encryptedBytes = Buffer.from(encryptedBase64, 'base64');
    let keyBytes = Buffer.concat([
        Buffer.from(key, 'utf8'),
        Buffer.from([0, 0, 0, 0])

    ]);
    keyBytes = keyBytes.slice(0, 16);
    const ivBytes = keyBytes;
    const decipher = crypto.createDecipheriv('aes-128-cbc', keyBytes, ivBytes);
    decipher.setAutoPadding(false);
    let decrypted = Buffer.concat([
        decipher.update(encryptedBytes),
        decipher.final()
    ]);
    const padding = decrypted[decrypted.length - 1];
    decrypted = decrypted.slice(0, decrypted.length - padding);
    return decrypted;
}

// Uncompress (gzinflate)
function gzinflate(base64Str: string): string {
    const compressed = Buffer.from(base64Str, 'base64');
    const inflated = pako.inflateRaw(compressed);
    return Buffer.from(inflated).toString('utf8');
}

// Remove BOM and parse JSON safely
function safeJSONParse(str: string) {
    // Remove BOM if exists
    str = str.replace(/^\uFEFF/, '');
    return JSON.parse(str);
}

/**
 * @swagger
 * /api/admin/marg/check-live-order-dispatch-status:
 *   post:
 *     summary: Check live order dispatch status
 *     description: Returns a simple message indicating the live order dispatch status.
 *     responses:
 *       200:
 *         description: Success message
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Live order dispatch status checked successfully.
 */


async function runBackground(jsonData: any) {

        const OrderInfo = jsonData?.Details?.OrderInfo || [];
        const bulkOps: any[] = [];

        for (const element of OrderInfo) {

            // const checkOrder = await Order.findOne({ margOrderNo: element.OrderID });        

            bulkOps.push({
                updateOne: {
                    filter: { margOrderNo: element.OrderID },
                    update: {
                        $set: {
                            margOrderDispatchData: element
                        }
                    }
                }
            });

        }

        await Order.bulkWrite(bulkOps, { ordered: false });

}

export async function POST(req: NextRequest) {

    const url = 'https://corporate.margerp.com/api/eOnlineData/LiveOrderDispatchStatus2017';
    const key = '48TPI07W1R2S';
    const now = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");
    const payload = {
        CompanyCode: 'PharmatoInd2',
        MargID: 486257,
        SalesmanID: 306832,
        Type: "S",
        // Datetime: now,
        Datetime: `2026-02-01 19:30:17`, // ✅ HARDCODE for testing (1st Feb 2026, 12:00:00 AM IST)
        index: 0,
    };

    const response = await axios.post(url, payload, {
        headers: { 'Content-Type': 'application/json' }
    });

    // console.log("response", response);

    const encryptedResponse = response.data;
    // console.log("encryptedResponse", encryptedResponse);
    const decrypted = decryptAES(encryptedResponse, key);
    // console.log("decrypted", decrypted);
    const inflated = gzinflate(decrypted.toString());
    // console.log("inflated", inflated);
    const jsonData = safeJSONParse(inflated);
    // console.log("jsonData", jsonData);

    if (jsonData?.Details) {

        // background me chala do
        setImmediate(() => {
            runBackground(jsonData);
        });

        return NextResponse.json({ success: true, message: 'Live order dispatch status checked successfully.' ,data: jsonData});

    } else {

        return NextResponse.json({ success: false, message: 'Live order dispatch status checked failed.' });

    }
}
