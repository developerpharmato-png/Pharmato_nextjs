// Category and subcategory mapping array
const categoryMappings = [
    { "categoryId": "6931743a75a7747335909273", "subcategoryIds": ["6931743a75a77473359092a0", "6931743a75a77473359092a3", "6931743b75a77473359092a6"] },
    { "categoryId": "6931743a75a7747335909276", "subcategoryIds": ["6931743b75a77473359092a9", "6931743b75a77473359092ac", "6931743b75a77473359092af"] },
    { "categoryId": "6931743a75a7747335909279", "subcategoryIds": ["6931743b75a77473359092b2", "6931743b75a77473359092b5", "6931743b75a77473359092b8", "6931743b75a77473359092bb"] },
    { "categoryId": "6931743a75a774733590927c", "subcategoryIds": ["6931743b75a77473359092be", "6931743b75a77473359092c1", "6931743b75a77473359092c4"] },
    { "categoryId": "6931743a75a774733590927f", "subcategoryIds": ["6931743b75a77473359092c7", "6931743b75a77473359092ca", "6931743b75a77473359092cd"] },
    { "categoryId": "6931743a75a7747335909282", "subcategoryIds": ["6931743b75a77473359092d0", "6931743b75a77473359092d3", "6931743c75a77473359092d6"] },
    { "categoryId": "6931743a75a7747335909285", "subcategoryIds": ["6931743c75a77473359092d9", "6931743c75a77473359092dc", "6931743c75a77473359092df"] },
    { "categoryId": "6931743a75a7747335909288", "subcategoryIds": ["6931743c75a77473359092e2", "6931743c75a77473359092e5", "6931743c75a77473359092e8"] },
    { "categoryId": "6931743a75a774733590928b", "subcategoryIds": ["6931743c75a77473359092eb", "6931743c75a77473359092ee"] },
    { "categoryId": "6931743a75a774733590929d", "subcategoryIds": ["6932b15fbde6c1019b011d70", "693414b1f1d5dbbcaa41ee6a"] },
    { "categoryId": "6931743a75a7747335909291", "subcategoryIds": ["6936861b5a8624b35a2acbc5"] },
    { "categoryId": "6936acd6a541dc096c3e508d", "subcategoryIds": ["6939222e9025e2f3a0edc10b"] }
];

function getRandomCategoryAndSubcategory() {
    const mapping = categoryMappings[Math.floor(Math.random() * categoryMappings.length)];
    const categoryId = mapping.categoryId;
    const subCategoryId = mapping.subcategoryIds[
        Math.floor(Math.random() * mapping.subcategoryIds.length)
    ];
    return { categoryId, subCategoryId };
}
// Convert expiry string (YYYYMMDD) to Date
function convertExpiry(exp: string): Date | null {
    if (!exp) return null;
    const expString = String(exp);
    if (expString.length !== 8) return null;
    const year = expString.slice(0, 4);
    const month = expString.slice(4, 6);
    const day = expString.slice(6, 8);
    return new Date(`${year}-${month}-${day}`);
}

// Compute price as 15% less than MRP, rounded to 2 decimals
function computePriceFromMrp(mrp: number | string): number {
    const mrpNum = Number(mrp);
    if (!isFinite(mrpNum) || isNaN(mrpNum)) return 0;
    return Math.round(mrpNum * 0.85 * 100) / 100;
}
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import crypto from 'crypto';
import pako from 'pako';
import Medicine from '@/models/Medicine';
import mongoose from 'mongoose';

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

        // const bulkInsertArray: any[] = [];
        // const bulkOps: any[] = [];

        // let medCount = await Medicine.countDocuments();
        // for (const p of products) {
        //     const checkMedicine = await Medicine.findOne({ uniqueIdentity: p.rid });
        //     const expiry = convertExpiry(p.exp);
        //     const { categoryId, subCategoryId } = getRandomCategoryAndSubcategory();
        //     if (checkMedicine) {
        //         if (!p) continue;
        //         const medObj = {
        //             uniqueIdentity: p.rid,
        //             name: p.name,
        //             manufacturer: p.company,
        //             price: computePriceFromMrp(p.MRP),
        //             purchasePrice: Number(p.PRate) || 0,
        //             mrp: Number(p.MRP) || 0,
        //             stock: Number(p.stock) || 0,
        //             batchNumber: p.code,
        //             isDeleted: p.Is_Deleted === "1",
        //             expiryDate: expiry instanceof Date && !isNaN(expiry.getTime()) ? expiry : null,
        //             margData: p,
        //             // uniqueCode,
        //             // categoryId: new mongoose.Types.ObjectId(categoryId),
        //             // subCategoryId: new mongoose.Types.ObjectId(subCategoryId)
        //         };
        //         bulkOps.push({
        //             updateOne: {
        //                 filter: { uniqueIdentity: p.rid },     // If exists → update
        //                 update: { $set: medObj },
        //                 upsert: true                            // If not exists → insert
        //             }
        //         });
        //     } else {
        //         medCount++;
        //         const uniqueCode = `MED-${medCount}`;
        //         bulkInsertArray.push({
        //             uniqueIdentity: p.rid,
        //             name: p.name,                    
        //             manufacturer: p.company,
        //             price: computePriceFromMrp(p.MRP),
        //             purchasePrice: Number(p.PRate) || 0,
        //             mrp: Number(p.MRP) || 0,
        //             stock: Number(p.stock) || 0,
        //             batchNumber: p.code,
        //             isDeleted: p.Is_Deleted === "1",
        //             expiryDate: expiry instanceof Date && !isNaN(expiry.getTime()) ? expiry : null,
        //             margData: p,
        //             categoryId: new mongoose.Types.ObjectId(categoryId),
        //             subCategoryId: new mongoose.Types.ObjectId(subCategoryId),
        //             uniqueCode
        //         });
        //     }
        // }

        // // 🚀 BULK WRITE (super fast for both insert + update)
        // if (bulkOps.length > 0) {
        //     await Medicine.bulkWrite(bulkOps, { ordered: false });
        // }

        // // 🚀 Bulk Insert — MUCH faster than .create()
        // if (bulkInsertArray.length > 0) {
        //     await Medicine.insertMany(bulkInsertArray, { ordered: false });
        // }

        // return NextResponse.json({ success: true, message: 'Medicines imported successfully.', data : products , count : products.length});
        return NextResponse.json({ success: true, message: 'Medicines imported successfully.', count : products.length});

    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message || 'MargERP API error' }, { status: 500 });
    }
}
