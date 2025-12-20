import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import crypto from 'crypto';
import pako from 'pako';
import * as xlsx from 'xlsx';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import os from 'os';
import zlib from 'zlib';
import stream from 'stream';

// Category and subcategory mapping (copied from existing marg route)
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

// Convert expiry string (YYYYMMDD) to ISO date string or empty
function convertExpiryToString(exp: string): string {
    if (!exp) return '';
    const expString = String(exp);
    if (expString.length !== 8) return '';
    const year = expString.slice(0, 4);
    const month = expString.slice(4, 6);
    const day = expString.slice(6, 8);
    const d = new Date(`${year}-${month}-${day}`);
    if (isNaN(d.getTime())) return '';
    return d.toISOString();
}

// Decrypt AES-128-CBC (no padding) — same logic as existing route
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

function gzinflate(base64Str: string): string {
    const compressed = Buffer.from(base64Str, 'base64');
    const inflated = pako.inflateRaw(compressed);
    return Buffer.from(inflated).toString('utf8');
}

function safeJSONParse(str: string) {
    str = str.replace(/^\uFEFF/, '');
    return JSON.parse(str);
}

// Compute price as 15% less than MRP, rounded to 2 decimals
function computePriceFromMrp(mrp: number | string): number {
    const mrpNum = Number(mrp);
    if (!isFinite(mrpNum) || isNaN(mrpNum)) return 0;
    return Math.round(mrpNum * 0.85 * 100) / 100;
}

/**
 * @swagger
 * /api/admin/marg/export:
 *   post:
 *     summary: Export Marg products to Excel and email to provided address
 *     tags:
 *       - Admin
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: Recipient email address
 *     responses:
 *       200:
 *         description: Excel generated and emailed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 rows:
 *                   type: integer
 *       400:
 *         description: Bad request (missing email)
 *       500:
 *         description: Internal server error
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const toEmail = body?.email;
        if (!toEmail) return NextResponse.json({ success: false, message: 'email is required in body' }, { status: 400 });

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
        if (typeof encryptedResponse !== 'string') {
            return NextResponse.json({ success: false, message: 'unexpected response format from Marg' }, { status: 502 });
        }

        const decrypted = decryptAES(encryptedResponse, key);
        const inflated = gzinflate(decrypted.toString());
        const jsonData = safeJSONParse(inflated);

        const products = jsonData?.Details?.pro_N || [];

        // Build rows matching DB fields used in marg route
        const rows: Record<string, any>[] = products.map((p: any, idx: number) => {
            const { categoryId, subCategoryId } = getRandomCategoryAndSubcategory();
            return {
                uniqueIdentity: p.rid,
                name: p.name,
                manufacturer: p.company,
                price: computePriceFromMrp(p.MRP),
                purchasePrice: Number(p.PRate) || 0,
                mrp: Number(p.MRP) || 0,
                stock: Number(p.stock) || 0,
                batchNumber: p.code,
                isDeleted: p.Is_Deleted === '1',
                expiryDate: convertExpiryToString(p.exp),
                margData: JSON.stringify(p),
                categoryId,
                subCategoryId,
                uniqueCode: `MED-${Date.now()}-${idx}`
            };
        });

        const worksheet = xlsx.utils.json_to_sheet(rows);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, 'marg_products');

        // Ensure uploads dir
        const uploadsDir = path.join(process.cwd(), 'uploads');
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

        const baseName = `marg_products_${Date.now()}`;
        let filePath = path.join(uploadsDir, `${baseName}.xlsx`);

        // Write workbook to local file to avoid buffering large buffer in memory
        try {
            xlsx.writeFile(workbook, filePath);
        } catch (writeErr) {
            // fallback: write to OS temp dir using buffer
            try {
                const fallbackDir = os.tmpdir();
                const fallbackPath = path.join(fallbackDir, `${baseName}.xlsx`);
                const buf = xlsx.write(workbook, { bookType: 'xlsx', type: 'buffer' });
                fs.writeFileSync(fallbackPath, buf);
                // replace filePath so downstream uses fallback file
                filePath = fallbackPath;
            } catch (fallbackErr) {
                return NextResponse.json({ success: false, message: 'Failed to save workbook to disk', error: String(fallbackErr) }, { status: 500 });
            }
        }

        // Send email with gzipped streamed attachment to avoid large memory usage and reduce size
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
            port: Number(process.env.SMTP_PORT) || 587,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            },
            tls: { rejectUnauthorized: false },
            logger: process.env.SMTP_DEBUG === 'true',
            debug: process.env.SMTP_DEBUG === 'true'
        });

        // verify transporter
        try {
            await transporter.verify();
        } catch (verifyErr) {
            return NextResponse.json({ success: false, message: 'SMTP verify failed', error: String(verifyErr) }, { status: 502 });
        }

        const readStream = fs.createReadStream(filePath);
        const gzip = zlib.createGzip({ level: 9 });
        const pass = new stream.PassThrough();
        readStream.pipe(gzip).pipe(pass);

        const mailOptions = {
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: toEmail,
            subject: 'Marg products export',
            html: `<p>Please find attached the Marg products export (${rows.length} rows). The file is gzipped.</p>`,
            attachments: [
                { filename: `${baseName}.xlsx.gz`, content: pass }
            ]
        };

        let sendResult;
        try {
            sendResult = await transporter.sendMail(mailOptions as any);
        } catch (sendErr: any) {
            return NextResponse.json({ success: false, message: 'Failed to send email', error: sendErr?.message || String(sendErr) }, { status: 502 });
        } finally {
            // cleanup local file
            try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }
        }

        return NextResponse.json({ success: true, message: 'Excel generated and emailed', rows: rows.length, info: sendResult });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err?.message || String(err) }, { status: 500 });
    }
}
