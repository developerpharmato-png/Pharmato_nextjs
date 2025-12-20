import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';
import os from 'os';
import zlib from 'zlib';
import stream from 'stream';
import nodemailer from 'nodemailer';

// Utility to decrypt and inflate Marg data (reuse from main export if needed)
import crypto from 'crypto';
import pako from 'pako';

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

/**
 * @swagger
 * /api/admin/marg/export-direct:
 *   post:
 *     summary: Export Marg products to Excel (raw, as received from Marg)
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
        const key = '48TPI07W1R2S'; // Move to env in production
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

        // Export the products array exactly as received from Marg
        const products = jsonData?.Details?.pro_N || [];

        // Write all fields as-is
        const worksheet = xlsx.utils.json_to_sheet(products);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, 'marg_products_raw');

        // Ensure uploads dir
        const uploadsDir = path.join(process.cwd(), 'uploads');
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

        const baseName = `marg_products_raw_${Date.now()}`;
        let filePath = path.join(uploadsDir, `${baseName}.xlsx`);

        // Write workbook to local file
        try {
            xlsx.writeFile(workbook, filePath);
        } catch (writeErr) {
            // fallback: write to OS temp dir using buffer
            try {
                const fallbackDir = os.tmpdir();
                const fallbackPath = path.join(fallbackDir, `${baseName}.xlsx`);
                const buf = xlsx.write(workbook, { bookType: 'xlsx', type: 'buffer' });
                fs.writeFileSync(fallbackPath, buf);
                filePath = fallbackPath;
            } catch (fallbackErr) {
                return NextResponse.json({ success: false, message: 'Failed to save workbook to disk', error: String(fallbackErr) }, { status: 500 });
            }
        }

        // Send email with gzipped streamed attachment
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
            subject: 'Marg products export (raw)',
            html: `<p>Please find attached the Marg products export (raw, as received from Marg, ${products.length} rows). The file is gzipped.</p>`,
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
            try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }
        }

        return NextResponse.json({ success: true, message: 'Excel generated and emailed (raw export)', rows: products.length, info: sendResult });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err?.message || String(err) }, { status: 500 });
    }
}
