import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import crypto from 'crypto';
import pako from 'pako';

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
 * /api/admin/marg:
 *   post:
 *     summary: Fetch product data from MargERP
 *     tags:
 *       - Marg
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               CompanyCode:
 *                 type: string
 *               MargID:
 *                 type: integer
 *               Datetime:
 *                 type: string
 *               index:
 *                 type: integer
 *     responses:
 *       200:
 *         description: MargERP product data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                 error:
 *                   type: string
 */
export async function POST(request: NextRequest) {
    try {
        const url = 'https://wservices.margcompusoft.com/api/eOnlineData/MargMST2017';
        const key = 'CJ4IJ1O85Q7Y';
        const payload = {
            CompanyCode: 'TESTCOMPANY',
            MargID: 230965,
            Datetime: '',
            index: 0
        };

        const response = await axios.post(url, payload, {
            headers: { 'Content-Type': 'application/json' }
        });

        const encryptedResponse = response.data;

        const decrypted = decryptAES(encryptedResponse, key);
        const inflated = gzinflate(decrypted.toString());

        // Convert to JSON (object/array automatically)
        const jsonData = safeJSONParse(inflated);

        return NextResponse.json({ success: true, data : jsonData?.Details?.pro_N.slice(0, 6)});
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message || 'MargERP API error' }, { status: 500 });
    }
}
