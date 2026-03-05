import { NextRequest, NextResponse } from "next/server";
/**
 * @swagger
 * /api/admin/medicines/export:
 *   post:
 *     summary: Export all medicines as Excel and email to user
 *     tags:
 *       - Admin Medicines
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: Email address to send the exported Excel file
 *             required:
 *               - email
 *     responses:
 *       200:
 *         description: Export started, email will be sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Email is required in the request body
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
import connectDB from "@/lib/mongodb";
import Medicine from "@/models/Medicine";
import Category from "@/models/Category";
import SubCategory from "@/models/SubCategory";
import * as XLSX from "xlsx";
import nodemailer from "nodemailer";
import { SendMailClient } from "zeptomail";

const url: any = "https://api.zeptomail.in/v1.1/email";
const token: any = "Zoho-enczapikey PHtE6r0IEbjo2jQro0cHsfOwRZKkPIl89O00LQFDs48RCfcKSk0G+Nl9k2C2qkouUvlGR6SYnN9pubua4rmALD3pZz4fXmqyqK3sx/VYSPOZsbq6x00bs1oTckzYV4/petVs0STevNncNA==";

const client = new SendMailClient({ url, token });


async function runBackground(email: string) {
  // Always export all medicines, ignore any date filtering
  const medicines = await Medicine.find({})
    .populate("categoryId", "name")
    .populate("subCategoryId", "name");

  // Debug log to verify images and all fields
  const data = medicines.map((m) => {
    return {
      ID: m.uniqueCode,
      Name: m.name,
      Description: m.description,
      Manufacturer: m.manufacturer,
      "Medicine Type": m.medicineType,
      Unit: m.unit,
      Category: m.categoryId?.name || m.category || "",
      "Sub Category": m.subCategoryId?.name || "",
      Price: m.price,
      "Purchase Price": m.purchasePrice,
      MRP: m.mrp,
      Discount: m.discount,
      Stock: m.stock,
      "Expiry Date": m.expiryDate ? new Date(m.expiryDate).toLocaleDateString() : "",
      "Batch Number": m.batchNumber,
      OTC: m.isOTC ? "Yes" : "No",
      Prescription: m.isPrescription ? "Yes" : "No",
      Active: m.isActive ? "Yes" : "No",
      "Created Date": m.createdAt ? new Date(m.createdAt).toLocaleString() : "",
      "Last Updated ": m.updatedAt ? new Date(m.updatedAt).toLocaleString() : "",
      // "Unique Identity": m.uniqueIdentity,
      // "Store ID": m.storeId,
      // Deleted: m.isDeleted,
      // Rating: m.rating ? JSON.stringify(m.rating) : "",
      // "Marg Data": m.margData ? JSON.stringify(m.margData) : "",
      // Images: m.images && m.images.length ? m.images.join(", ") : "",
      // "Cover Image": m.coverImage || "",
      Highlights: m.highlights && m.highlights.length ? m.highlights.join(", ") : "",
      // "Related Products": m.relatedProducts && m.relatedProducts.length ? JSON.stringify(m.relatedProducts) : "",
      // "Cross Sell Products": m.crossSellProducts && m.crossSellProducts.length ? JSON.stringify(m.crossSellProducts) : "",
      Composition: m.composition && m.composition.length ? JSON.stringify(m.composition) : "",
    };
  });

  // Create worksheet and workbook
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Medicines");

  // Write workbook to buffer
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  // Send email with the Excel attachment
  const transporter = nodemailer.createTransport({
    host: 'mail.smtp2go.com',
    port: 2525,
    auth: {
      user: 'sunil.patidar+2@technotoil.com',
      pass: 'tJ2juQjWYyOPbUpM'
    }
  });

  let mailOptions = {
    from: 'sunil.patidar+2@technotoil.com',
    to: email, // Use provided recipient email
    subject: "Medicines Export",
    text: 'Please find the attached Excel file.',
    attachments: [
      {
        filename: `medicines_export.xlsx`,
        content: buffer,
      }
    ]
  };

  let response = await transporter.sendMail(mailOptions);
  console.log('Email sent successfully:', response);

}

export async function POST(request: NextRequest) {
  await connectDB();

  const body = await request.json();
  const email = body.email;
  if (!email) {
    return NextResponse.json({ success: false, message: "Email is required in the request body." }, { status: 400 });
  }

  setImmediate(() => {
    runBackground(email);
  });

  return NextResponse.json({ success: true, message: "Export started. You will receive an email with the Excel file shortly." });
}
