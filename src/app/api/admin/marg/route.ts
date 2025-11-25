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
        // Ignore request body, use static payload
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
        const products = Array.isArray(jsonData?.Details?.pro_N) ? jsonData.Details.pro_N : [];
        for (const item of products) {
            console.log('MargERP item:', item);
            if (!item) continue;
            const mrp = !isNaN(Number(item?.MRP)) ? Number(item?.MRP) : 0;
            const price = !isNaN(Number(item?.Rate)) ? Number(item?.Rate) : 0;
            const discount = (mrp > 0 && price > 0) ? Math.round(((mrp - price) / mrp) * 100) : 0;
            // Parse expiryDate safely
            const expRaw = item?.exp?.trim();
            let expiryDate: Date | null = null;
            if (expRaw && expRaw.length > 0 && !isNaN(Date.parse(expRaw))) {
                expiryDate = new Date(expRaw);
            } else {
                expiryDate = null;
            }
            const medicine = {
                uniqueIdentity: item?.rid || '',
                name: item?.name?.trim() || 'Unnamed',
                stock: !isNaN(Number(item?.stock)) ? Number(item?.stock) : 0,
                manufacturer: item?.company || 'Unknown',
                mrp,
                price,
                purchasePrice: !isNaN(Number(item?.PRate)) ? Number(item?.PRate) : 0,
                isDeleted: item?.Is_Deleted === '1',
                isActive: item?.Is_Deleted === '0',
                expiryDate,
                batchNumber: item?.curbatch?.trim() || `BATCH-${item?.code}`,
                // Defaults for new model fields
                description: '',
                category: 'Other',
                categoryId: null,
                subCategoryId: null,
                isOTC: false,
                isPrescription: false,
                discount,
                composition: [],
                images: [],
                highlights: [],
                relatedProducts: [],
                rating: { average: 0, count: 0 },
                margData: item,
            };
            // Save to DB (upsert by uniqueIdentity)
            await Medicine.findOneAndUpdate(
                { uniqueIdentity: medicine.uniqueIdentity },
                medicine,
                { upsert: true, new: true }
            );
        }
        return NextResponse.json({ success: true, message: 'Medicines imported successfully.' });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message || 'MargERP API error' }, { status: 500 });
    }
}
