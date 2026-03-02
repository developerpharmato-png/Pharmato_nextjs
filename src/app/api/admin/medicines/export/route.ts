import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Medicine from "@/models/Medicine";
import Category from "@/models/Category";
import SubCategory from "@/models/SubCategory";
import * as XLSX from "xlsx";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
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

    // Return as file download
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename=medicines_export.xlsx`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
