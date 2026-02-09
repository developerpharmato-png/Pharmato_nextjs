/**
 * @swagger
 * /api/medicines:
 *   get:
 *     summary: Get all medicines
 *     tags:
 *       - Medicine
 *     responses:
 *       200:
 *         description: List of medicines
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Medicine'
 *   post:
 *     summary: Create a new medicine
 *     tags:
 *       - Medicine
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Medicine'
 *     responses:
 *       201:
 *         description: Medicine created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Medicine'
 */
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import connectDB from "@/lib/mongodb";
import Medicine from "@/models/Medicine";
import Category from "@/models/Category";
import SubCategory from "@/models/SubCategory";
import mongoose from "mongoose";
import { verifyJwt } from '@/utils/jwt';
import authorize from '@/middleware/authorize';

export async function GET(request: NextRequest) {
  // authorize customer (checks Authorization header or access_token cookie)
  const authRes = await authorize(request);
  if (authRes) return authRes;

  try {
    await connectDB();

    const url = new URL(request.url);
    // Normalize search: decode and convert '+' to space
    const rawSearch = url.searchParams.get("search");
    const search = (rawSearch ? decodeURIComponent(rawSearch).replace(/\+/g, " ") : "").trim();
    const limit = parseInt(url.searchParams.get("limit") || "10", 10);
    const offset = parseInt(url.searchParams.get("offset") || "0", 10);
    const medicineFilter = url.searchParams.get("medicineFilter") || "all";

    // Read and normalize query params: decode and convert '+' to spaces
    const rawCategoryId = url.searchParams.get("categoryId");
    const rawSubCategoryId = url.searchParams.get("subCategoryId");
    const categoryId = rawCategoryId
      ? decodeURIComponent(rawCategoryId).replace(/\+/g, " ")
      : null;
    const subCategoryId = rawSubCategoryId
      ? decodeURIComponent(rawSubCategoryId).replace(/\+/g, " ")
      : null;

    // Validate categoryId and subCategoryId
    // By default do NOT filter on isActive so both active/inactive are returned unless client specifies `isActive` query param
    const baseFilter: any = {};
    if (url.searchParams.has('isActive')) {
      const isActiveParam = url.searchParams.get('isActive');
      if (isActiveParam === 'true') baseFilter.isActive = true;
      else if (isActiveParam === 'false') baseFilter.isActive = false;
    }

    // Apply medicine filter
    if (medicineFilter === 'active') {
      baseFilter.isActive = true;
    } else if (medicineFilter === 'inactive') {
      baseFilter.isActive = false;
    } else if (medicineFilter === 'expired') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      baseFilter.expiryDate = { $lt: today };
    } else if (medicineFilter === 'outofstock') {
      baseFilter.$or = [
        { stock: { $lte: 0 } },
        { stock: { $exists: false } }
      ];
    }

    if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
      baseFilter.categoryId = categoryId;
    } else if (categoryId) {
      const category = await Category.findOne({
        name: new RegExp(`^${categoryId}$`, "i"),
      });
      if (category) {
        baseFilter.categoryId = category._id;
      }
    }

    if (subCategoryId && mongoose.Types.ObjectId.isValid(subCategoryId)) {
      baseFilter.subCategoryId = subCategoryId;
    } else if (subCategoryId) {
      const subCategory = await SubCategory.findOne({
        name: new RegExp(`^${subCategoryId}$`, "i"),
      });
      if (subCategory) {
        baseFilter.subCategoryId = subCategory._id;
      }
    }

    if (search) {
      // Escape user input for safe regex (so '*' and other metacharacters are treated literally)
      const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const pattern = escapeRegExp(search);

      // Find matching category IDs by name
      const matchingCategories = await Category.find({
        name: { $regex: pattern, $options: 'i' }
      }).select('_id');
      const matchingCategoryIds = matchingCategories.map(c => c._id);

      // Find matching subcategory IDs by name
      const matchingSubcategories = await SubCategory.find({
        name: { $regex: pattern, $options: 'i' }
      }).select('_id');
      const matchingSubcategoryIds = matchingSubcategories.map(s => s._id);

      // Search across multiple fields: uniqueCode, name, description, manufacturer, categoryId, subCategoryId
      baseFilter.$or = [
        { uniqueCode: { $regex: new RegExp(pattern, "i") } },
        { name: { $regex: new RegExp(pattern, "i") } },
        { description: { $regex: new RegExp(pattern, "i") } },
        { manufacturer: { $regex: new RegExp(pattern, "i") } },
        { categoryId: { $in: matchingCategoryIds } },
        { subCategoryId: { $in: matchingSubcategoryIds } }
      ];
    }

    const total = await Medicine.countDocuments(baseFilter);

    const medicines = await Medicine.find(baseFilter)
      .populate("categoryId", "name isOTC")
      .populate("subCategoryId", "name isOTC")
      .populate("relatedProducts", "name price images")
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);

    return NextResponse.json({ success: true, data: medicines, total });
  } catch (error) {
    console.error("GET /api/medicines error", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: "Failed to fetch medicines", details: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {


  try {
    await connectDB();
    const body = await request.json();

    // Derive OTC from category/subcategory, fallback to category
    let isOTC = false;
    if (body.subCategoryId) {
      const sub = await SubCategory.findById(body.subCategoryId).select(
        "isOTC"
      );
      if (sub) isOTC = !!sub.isOTC;
    }
    if (!body.subCategoryId && body.categoryId) {
      const cat = await Category.findById(body.categoryId).select("isOTC");
      if (cat) isOTC = !!cat.isOTC;
    }

    // Validate new fields
    // if (!Array.isArray(body.composition) || body.composition.some((c: { name: string; value: string }) => !c.name || !c.value)) {
    //     return NextResponse.json({ success: false, error: 'Invalid composition details' }, { status: 400 });
    // }
    if (body.images && !Array.isArray(body.images)) {
      return NextResponse.json(
        { success: false, error: "Images must be an array" },
        { status: 400 }
      );
    }
    if (body.highlights && !Array.isArray(body.highlights)) {
      return NextResponse.json(
        { success: false, error: "Highlights must be an array" },
        { status: 400 }
      );
    }
    if (body.relatedProducts && !Array.isArray(body.relatedProducts)) {
      return NextResponse.json(
        { success: false, error: "Related products must be an array" },
        { status: 400 }
      );
    }

    // Always set unit from body (if present)
    const payloadBase: any = {
      ...body,
      isOTC,
      unit: body.unit || "",
    };

    // helper to build a safe uniqueIdentity (max 100 chars)
    const makeUniqueIdentity = (name?: string) => {
      const base = (name || "med")
        .toString()
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .slice(0, 40);
      const suffix =
        Date.now().toString(36) + "-" + crypto.randomBytes(4).toString("hex");
      return (base + "-" + suffix).slice(0, 100);
    };

    // Ensure uniqueIdentity present and not empty. If provided and empty string, override.
    if (!payloadBase.uniqueIdentity) {
      payloadBase.uniqueIdentity = makeUniqueIdentity(body.name);
    }

    // Try creation, retrying a few times if uniqueIdentity collides (defensive)
    const maxAttempts = 3;
    let medicine: any = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        medicine = await Medicine.create(payloadBase);
        break;
      } catch (err: any) {
        // if duplicate on uniqueIdentity, try regenerate and retry
        if (
          err?.code === 11000 &&
          err.keyPattern &&
          err.keyPattern.uniqueIdentity
        ) {
          payloadBase.uniqueIdentity = makeUniqueIdentity(
            body.name + "-" + attempt
          );
          // continue to next attempt
          continue;
        }
        // rethrow other errors to outer catch
        throw err;
      }
    }

    if (!medicine) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create medicine due to uniqueIdentity collision",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, data: medicine },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Medicine create error:", error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(
        (val: any) => val.message
      );
      return NextResponse.json(
        { success: false, error: messages },
        { status: 400 }
      );
    }
    if (
      error.code === 11000 &&
      error.keyPattern &&
      error.keyPattern.batchNumber
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Batch number already exists. Please use a unique batch number.",
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create medicine" },
      { status: 500 }
    );
  }
}
