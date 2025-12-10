import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import crypto from 'crypto';
import pako from 'pako';
import Medicine from '@/models/Medicine';

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
 *     summary: Import products from MargERP
 *     tags:
 *       - Admin
 *     responses:
 *       200:
 *         description: Products imported successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       500:
 *         description: Internal server error
 */
export async function POST(request: NextRequest) {
    try {

        const url = 'https://wservices.margcompusoft.com/api/eOnlineData/MargMST2017';

        const key = '48TPI07W1R2S';
        const payload = {
            CompanyCode: 'PharmatoInd2',
            MargID: 486257,
            Datetime: '',
            index: 0
        };

        const response = await axios.post(url, payload, {
            headers: { 'Content-Type': 'application/json' }
        });

        const encryptedResponse = response.data;
        const decrypted = decryptAES(encryptedResponse, key);
        const inflated = gzinflate(decrypted.toString());
        const jsonData = safeJSONParse(inflated);

        const products = jsonData?.Details?.pro_N || [];

        // 🔥 Insert Each Product Into DB
        const inserted = [];

        for (const p of products) {

            const checkMedicine = await Medicine.findOne({ uniqueIdentity: p.rid });

            if (checkMedicine) {

                console.log("Medicine already exists with uniqueIdentity:", p.rid);

            } else {

                const medObj = {
                    uniqueIdentity: p.rid,
                    name: p.name,
                    manufacturer: p.company,
                    price: Number(p.Rate) || 0,
                    purchasePrice: Number(p.PRate) || 0,
                    mrp: Number(p.MRP) || 0,
                    stock: Number(p.stock) || 0,
                    batchNumber: p.code,
                    isDeleted: p.Is_Deleted === "1" ? true : false,

                    // optional additional mapping (not mandatory)
                    margData: p
                };

                const saved = await Medicine.create(medObj);
                inserted.push(saved);

            }

        }

        return NextResponse.json({ success: true, message: 'Medicines imported successfully.' });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message || 'MargERP API error' }, { status: 500 });
    }
}
