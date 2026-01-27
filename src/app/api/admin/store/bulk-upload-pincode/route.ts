import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import * as XLSX from 'xlsx';

/**
 * @swagger
 * /api/admin/store/bulk-upload-pincode:
 *   post:
 *     summary: Bulk upload pincodes via Excel file
 *     tags:
 *       - Admin-Store
 *     requestBody:
 *       required: true
 *       content:
 *         application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *           schema:
 *             type: string
 *             format: binary
 *     responses:
 *       200:
 *         description: Excel data processed
 *       400:
 *         description: Invalid file
 */

export async function POST(req: NextRequest) {
    await dbConnect();
    try {
        const arrayBuffer = await req.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0]; 
        const worksheet = workbook.Sheets[sheetName];
        const data : any = XLSX.utils.sheet_to_json(worksheet);
        let pinCodeArray : any = [];
        for (const element  of data) {

            if (element.Pincode) {
                pinCodeArray.push(element.Pincode);
            }
          
        }
        console.log('Excel Data:', data);
        return NextResponse.json({ success: true, message: 'Excel file processed successfully', pinCodeArray });
    } catch (error: any) {
        console.error('Bulk upload pincode error:', error);
        return NextResponse.json({ success: false, message: 'Failed to process Excel file', error: error?.message }, { status: 400 });
    }
}
