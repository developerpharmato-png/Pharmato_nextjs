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
        console.log('Starting bulk upload processing...');
        
        // Parse the multipart form data
        const formData = await req.formData();
        const file = formData.get('file') as File;
        
        if (!file) {
            return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
        }
        
        console.log('File received:', file.name, 'Size:', file.size, 'Type:', file.type);
        
        if (file.size === 0) {
            return NextResponse.json({ success: false, message: 'Empty file received' }, { status: 400 });
        }
        
        // Convert file to array buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        console.log('Buffer size:', buffer.length);
        
        const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true, cellNF: false, cellText: false });
        
        console.log('Workbook sheets:', workbook.SheetNames);
        
        if (workbook.SheetNames.length === 0) {
            return NextResponse.json({ success: false, message: 'No sheets found in Excel file' }, { status: 400 });
        }
        
        const sheetName = workbook.SheetNames[0]; 
        console.log('Processing sheet:', sheetName);
        
        const worksheet = workbook.Sheets[sheetName];
        const data : any = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
        
        console.log('Raw sheet data (first 5 rows):', data.slice(0, 5));
        
        if (data.length === 0) {
            return NextResponse.json({ success: false, message: 'No data found in the sheet' }, { status: 400 });
        }
        
        // Get headers from first row
        const headers = data[0];
        console.log('Detected headers:', headers);
        
        // Find pincode column index
        const pincodeColumnIndex = headers.findIndex((header: any) => {
            const headerStr = String(header || '').toLowerCase().trim();
            return headerStr.includes('pincode') || headerStr.includes('pin code') || headerStr === 'pincode';
        });
        
        console.log('Pincode column index:', pincodeColumnIndex);
        
        if (pincodeColumnIndex === -1) {
            return NextResponse.json({ 
                success: false, 
                message: 'No pincode column found. Expected column names containing: pincode, pin code, etc.',
                availableHeaders: headers 
            }, { status: 400 });
        }
        
        let pinCodeArray : any = [];
        // Skip header row (start from index 1)
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            const pincodeValue = row[pincodeColumnIndex];
            
            if (pincodeValue !== null && pincodeValue !== undefined && pincodeValue !== '') {
                // Convert to number
                const pincodeNum = typeof pincodeValue === 'string' ? 
                    parseInt(pincodeValue.replace(/[^\d]/g, ''), 10) : 
                    Number(pincodeValue);
                    
                if (!isNaN(pincodeNum) && pincodeNum > 0 && pincodeNum.toString().length === 6) {
                    pinCodeArray.push(pincodeNum);
                }
            }
        }
        
        console.log('Final extracted pincodes:', pinCodeArray);
        return NextResponse.json({ 
            success: true, 
            message: `Excel file processed successfully. Found ${pinCodeArray.length} pincodes.`,
            pinCodeArray,
            debug: {
                fileName: file.name,
                fileSize: file.size,
                sheetName,
                totalRows: data.length - 1, // excluding header
                headers,
                pincodeColumnIndex
            }
        });
    } catch (error: any) {
        console.error('Bulk upload pincode error:', error);
        return NextResponse.json({ 
            success: false, 
            message: 'Failed to process Excel file', 
            error: error?.message,
            stack: error?.stack 
        }, { status: 400 });
    }
}
