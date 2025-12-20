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
      console.log('Exporting medicine:', {
        id: m._id,
        name: m.name,
        images: m.images,
        coverImage: m.coverImage,
        relatedProducts: m.relatedProducts,
        crossSellProducts: m.crossSellProducts,
        composition: m.composition
      });
      return {
        ID: m.uniqueCode,
        Name: m.name,
        Description: m.description,
        Manufacturer: m.manufacturer,
        Category: m.categoryId?.name || m.category || "",
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
        UniqueIdentity: m.uniqueIdentity,
        StoreId: m.storeId,
        isDeleted: m.isDeleted,
        Rating: m.rating ? JSON.stringify(m.rating) : "",
        MargData: m.margData ? JSON.stringify(m.margData) : "",
        Images: m.images && m.images.length ? m.images.join(", ") : "",
        CoverImage: m.coverImage || "",
        Highlights: m.highlights && m.highlights.length ? m.highlights.join(", ") : "",
        RelatedProducts: m.relatedProducts && m.relatedProducts.length ? JSON.stringify(m.relatedProducts) : "",
        CrossSellProducts: m.crossSellProducts && m.crossSellProducts.length ? JSON.stringify(m.crossSellProducts) : "",
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
