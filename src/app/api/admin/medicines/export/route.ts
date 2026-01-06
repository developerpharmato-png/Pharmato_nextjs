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
        ID: m._id.toString(),
        Name: m.name,
        description: m.description,
        manufacturer: m.manufacturer,
        medicineType: m.medicineType,
        unit: m.unit,
        category: m.categoryId?.name || m.category || "",
        subCategory: m.subCategoryId?.name || "",
        price: m.price,
        purchasePrice: m.purchasePrice,
        mrp: m.mrp,
        discount: m.discount,
        stock: m.stock,
        expiryDate: m.expiryDate ? new Date(m.expiryDate).toLocaleDateString() : "",
        batchNumber: m.batchNumber,
        isOTC: m.isOTC ? "Yes" : "No",
        isPrescription: m.isPrescription ? "Yes" : "No",
        isActive: m.isActive ? "Yes" : "No",
        createdAt: m.createdAt ? new Date(m.createdAt).toLocaleString() : "",
        updatedAt: m.updatedAt ? new Date(m.updatedAt).toLocaleString() : "",
        uniqueIdentity: m.uniqueIdentity,
        storeId: m.storeId,
        isDeleted: m.isDeleted,
        rating: m.rating ? JSON.stringify(m.rating) : "",
        margData: m.margData ? JSON.stringify(m.margData) : "",
        images: m.images && m.images.length ? m.images.join(", ") : "",
        coverImage: m.coverImage || "",
        highlights: m.highlights && m.highlights.length ? m.highlights.join(", ") : "",
        relatedProducts: m.relatedProducts && m.relatedProducts.length ? JSON.stringify(m.relatedProducts) : "",
        crossSellProducts: m.crossSellProducts && m.crossSellProducts.length ? JSON.stringify(m.crossSellProducts) : "",
        composition: m.composition && m.composition.length ? JSON.stringify(m.composition) : "",
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
