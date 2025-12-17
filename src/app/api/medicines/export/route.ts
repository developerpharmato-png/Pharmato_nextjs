import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Medicine from "@/models/Medicine";
import Category from "@/models/Category";
import SubCategory from "@/models/SubCategory";
import * as XLSX from "xlsx";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { startDate, endDate } = await request.json();
    let filter: any = {};
    let filename = "medicines_export";
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return NextResponse.json({ success: false, error: "Invalid date format" }, { status: 400 });
      }
      filter.createdAt = { $gte: start, $lte: end };
      filename += `_${startDate}_to_${endDate}`;
    }
    // Find medicines (all or by date)
    const medicines = await Medicine.find(filter)
      .populate("categoryId", "name")
      .populate("subCategoryId", "name");

    // Prepare data for Excel
    const data = medicines.map((m) => ({
      ID: m.uniqueCode,
      Name: m.name,
      Description: m.description,
      Manufacturer: m.manufacturer,
      Category: m.categoryId?.name || "",
      Subcategory: m.subCategoryId?.name || "",
      Price: m.price,
      PurchasePrice: m.purchasePrice,
      MRP: m.mrp,
      Discount: m.discount,
      Stock: m.stock,
      ExpiryDate: m.expiryDate ? new Date(m.expiryDate).toLocaleDateString() : "",
      BatchNumber: m.batchNumber,
      IsOTC: m.isOTC ? "Yes" : "No",
      IsPrescription: m.isPrescription ? "Yes" : "No",
      IsActive: m.isActive ? "Yes" : "No",
      CreatedAt: m.createdAt ? new Date(m.createdAt).toLocaleString() : "",
      UpdatedAt: m.updatedAt ? new Date(m.updatedAt).toLocaleString() : "",
    }));

    // Create worksheet and workbook
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Medicines");

    // Write workbook to buffer
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    // Return as file download
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename=${filename}.xlsx`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
