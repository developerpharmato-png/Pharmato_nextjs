// Category and subcategory mapping array
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
// Convert expiry string (YYYYMMDD) to Date
function convertExpiry(exp: string): Date | null {
  if (!exp) return null;
  const expString = String(exp);
  if (expString.length !== 8) return null;
  const year = expString.slice(0, 4);
  const month = expString.slice(4, 6);
  const day = expString.slice(6, 8);
  return new Date(`${year}-${month}-${day}`);
}

// Compute price as 15% less than MRP, rounded to 2 decimals
function computePriceFromMrp(mrp: number | string): number {
  const mrpNum = Number(mrp);
  if (!isFinite(mrpNum) || isNaN(mrpNum)) return 0;
  return Math.round(mrpNum * 0.85 * 100) / 100;
}

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import crypto from 'crypto';
import pako from 'pako';
import Medicine from '@/models/Medicine';
import mongoose from 'mongoose';
import Marg from '@/models/Marg';
import moment from "moment-timezone";

// Decrypt AES-128-CBC (no padding)
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

// Uncompress (gzinflate)
function gzinflate(base64Str: string): string {
  const compressed = Buffer.from(base64Str, 'base64');
  const inflated = pako.inflateRaw(compressed);
  return Buffer.from(inflated).toString('utf8');
}

// Remove BOM and parse JSON safely
function safeJSONParse(str: string) {
  // Remove BOM if exists
  str = str.replace(/^\uFEFF/, '');
  return JSON.parse(str);
}

function calculateDiscount(mrp?: number, price?: number) {
  if (typeof mrp === 'number' && typeof price === 'number' && mrp > 0) {
    let d = Math.round(((mrp - price) / mrp) * 100);
    if (d < 0) d = 0;
    if (d > 100) d = 100;
    return d;
  }
  return 0;
}

function extractPackSize(name: string): number {
  if (!name) return 1;

  // Match patterns like 1X15, 1*15, 2x10, 5*6 etc
  const match = name.match(/(\d+)\s*[xX*]\s*(\d+)/);

  if (match && match[2]) {
    return parseInt(match[2], 10);
  }

  return 1; // default if not found
}

function extractPackSizeFromRemarks(remarks: string): number {
  if (!remarks) return 1;

  // Match patterns like 1*10, 2x15, 10X1 etc
  const match = remarks.match(/(\d+)\s*[xX*]\s*(\d+)/);

  if (match && match[2]) {
    return parseInt(match[2], 10);
    // 👆 agar sirf second number chahiye (jaise 1*10 → 10)
  }

  return 1;
}



/**
 * @swagger
 * /api/admin/marg/cron:
 *   post:
 *     summary: Import products from MargERP
 *     tags:
 *       - Admin
 *     responses:
 *       200:
 *         description: Products imported successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       500:
 *         description: Internal server error
 */


// 👇👇 YAHI BANAO (API ke upar ya niche, dono chalega)
async function importMedicinesFromMarg() {
  try {

    // const latestMarg = await Marg.findOne({ status: "Completed" })
    //   .sort({ createdAt: -1 })
    //   .lean();

    const latestMarg = await Marg.findOne({
      status: "Completed",
    })
      .sort({ createdAt: -1 })
      .skip(1)
      .lean();

    const lastSyncDateTime = latestMarg ? moment(latestMarg.createdAt)
      .tz("Asia/Kolkata")
      .format("YYYY-MM-DD HH:mm:ss") : '';

    // console.log("&&&&&&&&&&&&&&lastSyncDateTime&&&&&&&&&&&&&",lastSyncDateTime);

    // const url = 'https://wservices.margcompusoft.com/api/eOnlineData/MargMST2017';
    const url = 'https://corporate.margerp.com/api/eOnlineData/MargMST2017';
    const key = '48TPI07W1R2S';
    const payload = {
      CompanyCode: 'PharmatoInd2',
      MargID: 486257,
      Datetime: `${lastSyncDateTime}`,
      // Datetime: `2026-03-17 19:30:17`, // ✅ HARDCODE for testing (1st Feb 2026, 12:00:00 AM IST)
      // Datetime: ``, // ✅ HARDCODE for testing (1st Feb 2026, 12:00:00 AM IST)
      index: 0
    };
    const response = await axios.post(url, payload, {
      headers: { 'Content-Type': 'application/json' }
    });

    // console.log("response", response);

    const encryptedResponse = response.data;
    // console.log("encryptedResponse", encryptedResponse);
    const decrypted = decryptAES(encryptedResponse, key);
    // console.log("decrypted", decrypted);
    const inflated = gzinflate(decrypted.toString());
    // console.log("inflated", inflated);
    const jsonData = safeJSONParse(inflated);
    // console.log("jsonData", jsonData);
    const products_pro_N = jsonData?.Details?.pro_N || [];
    const products_pro_U = jsonData?.Details?.pro_U || [];
    const products_pro_S = jsonData?.Details?.pro_S || [];
    const products_pro_R = jsonData?.Details?.pro_R || [];
    const products_Stype = jsonData?.Details?.Stype || [];
    const products_Party = jsonData?.Details?.Party || [];
    const products_Users = jsonData?.Details?.Users || [];
    const bulkInsertArray: any[] = [];
    const bulkOps: any[] = [];
    let data: any[] = [];
    let insertCount = 0

    // console.log("$$$$$$$$$jsonData$$$$$$$$$$$$", jsonData);

    const createMarg = await Marg.create({
      margGetDataCount: products_pro_N.length + products_pro_U.length + products_pro_S.length + products_pro_R.length,
      margInsertDataCount: 0,
      margUpdateDataCount: 0,
      status: 'Sync Started',
      type: 'Sync Marg Data',
      dateTime: moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss"),
      margInsertData: [],
      jsonData: jsonData
    });

    let medCount = await Medicine.countDocuments();
    for (const p of products_pro_N) {

      // const unitPackFactor = extractPackSize(p.name);
      const unitPackFactor = extractPackSizeFromRemarks(p.remarks);

      // console.log('#####unitPackFactor######', unitPackFactor);


      const checkMedicine = await Medicine.findOne({ uniqueIdentity: p.rid });
      const expiry = convertExpiry(p.exp);
      const { categoryId, subCategoryId } = getRandomCategoryAndSubcategory();


      const purchasePrice = Number(((Number(p.PRate) || 0) * Number(unitPackFactor)).toFixed(2)); // MRP ko unit pack factor se multiply karna, taki correct price aaye  
      const mrp = Number(((Number(p.MRP) || 0) * Number(unitPackFactor))); // MRP ko unit pack factor se multiply karna, taki correct price aaye      
      const price = Number(computePriceFromMrp(mrp).toFixed(2)); // Price calculate karna using MRP, discount ko consider karte hue
      // const purchasePrice = ((Number(p.PRate) || 0) * Number(unitPackFactor)); // MRP ko unit pack factor se multiply karna, taki correct price aaye      
      // const mrp = ((Number(p.MRP) || 0) * Number(unitPackFactor)); // MRP ko unit pack factor se multiply karna, taki correct price aaye      
      // const price = computePriceFromMrp(mrp); // Price calculate karna using MRP, discount ko consider karte hue
      const stock = Math.floor((Number(p.stock) || 0) / Number(unitPackFactor)); // Stock ko unit pack factor se divide karna, taki correct stock aaye


      if (checkMedicine) {

        const medObj = {
          price,
          mrp: mrp.toFixed(2),
          discount: mrp > 0 ? 15 : 0,
          purchasePrice: purchasePrice,
          stock: stock,
          unitPackFactor: unitPackFactor,
          isDeleted: p.Is_Deleted === "1",
          expiryDate: expiry instanceof Date && !isNaN(expiry.getTime()) ? expiry : null,
          margData: p,
          previousMargData: checkMedicine
        };

        bulkOps.push({
          updateOne: {
            filter: { uniqueIdentity: p.rid },     // If exists → update
            update: {
              $set: medObj
            }                          // If not exists → insert
          }
        });

      } else {
        medCount++;
        const uniqueCode = `MED-${medCount}`;

        bulkInsertArray.push({
          uniqueIdentity: p.rid,
          name: p.name,
          manufacturer: p.company,

          price,
          mrp: mrp.toFixed(2),
          discount: mrp > 0 ? 15 : 0,

          purchasePrice: purchasePrice,
          stock: stock,
          unitPackFactor: unitPackFactor,
          batchNumber: p.code,
          isDeleted: p.Is_Deleted === "1",
          expiryDate: expiry instanceof Date && !isNaN(expiry.getTime()) ? expiry : null,
          margData: p,
          previousMargData: {},
          categoryId: new mongoose.Types.ObjectId(categoryId),
          subCategoryId: new mongoose.Types.ObjectId(subCategoryId),
          uniqueCode
        });
      }

    }

    // 🚀 Bulk Insert — MUCH faster than .create()
    if (bulkInsertArray.length > 0) {

      data = await Medicine.insertMany(bulkInsertArray, { ordered: false });

    }

    insertCount = bulkInsertArray.length;

    for (const p of products_pro_U) {

      // const unitPackFactor = extractPackSize(p.name);
      const unitPackFactor = extractPackSizeFromRemarks(p.remarks);

      // console.log('#####unitPackFactor######', unitPackFactor);

      const checkMedicine = await Medicine.findOne({ uniqueIdentity: p.rid });
      const expiry = convertExpiry(p.exp);
      const { categoryId, subCategoryId } = getRandomCategoryAndSubcategory();

      // const price = computePriceFromMrp(p.MRP);
      // const mrp = Number(p.MRP) || 0;

      const purchasePrice = Number(((Number(p.PRate) || 0) * Number(unitPackFactor)).toFixed(2)); // MRP ko unit pack factor se multiply karna, taki correct price aaye  
      const mrp = Number(((Number(p.MRP) || 0) * Number(unitPackFactor))); // MRP ko unit pack factor se multiply karna, taki correct price aaye      
      const price = Number(computePriceFromMrp(mrp).toFixed(2)); // Price calculate karna using MRP, discount ko consider karte hue
      const stock = Math.floor((Number(p.stock) || 0) / Number(unitPackFactor)); // Stock ko unit pack factor se divide karna, taki correct stock aaye

      if (checkMedicine) {

        const medObj = {
          name: p.name,
          manufacturer: p.company,
          price,
          mrp: mrp.toFixed(2),
          discount: mrp > 0 ? 15 : 0,
          purchasePrice: purchasePrice,
          stock: stock,
          unitPackFactor: unitPackFactor,
          isDeleted: p.Is_Deleted === "1",
          expiryDate: expiry instanceof Date && !isNaN(expiry.getTime()) ? expiry : null,
          margData: p,
          previousMargData: checkMedicine
        };

        bulkOps.push({
          updateOne: {
            filter: { uniqueIdentity: p.rid },     // If exists → update
            update: {
              $set: medObj
            }                          // If not exists → insert
          }
        });

      }

    }

    for (const p of products_pro_S) {

      const checkMedicine = await Medicine.findOne({ batchNumber: p.code });

      if (checkMedicine) {

        const stock = Math.floor((Number(p.stock) || 0) / Number(checkMedicine.unitPackFactor || 1)); // Stock ko unit pack factor se divide karna, taki correct stock aaye

        const medObj = {
          stock: stock
        };

        bulkOps.push({
          updateOne: {
            filter: { batchNumber: p.code },     // If exists → update
            update: {
              $set: medObj
            }                          // If not exists → insert
          }
        });

      }

    }

    for (const p of products_pro_R) {

      const checkMedicine = await Medicine.findOne({ batchNumber: p.code });

      if (checkMedicine) {

        const unitPackFactor = checkMedicine.unitPackFactor || 1;
        const purchasePrice = Number(((Number(p.PRate) || 0) * Number(unitPackFactor)).toFixed(2)); // MRP ko unit pack factor se multiply karna, taki correct price aaye  
        const mrp = Number(((Number(p.MRP) || 0) * Number(unitPackFactor))); // MRP ko unit pack factor se multiply karna, taki correct price aaye      
        const price = Number(computePriceFromMrp(mrp).toFixed(2)); // Price calculate karna using MRP, discount ko consider karte hue
        // const purchasePrice = ((Number(p.PRate) || 0) * Number(unitPackFactor)); // MRP ko unit pack factor se multiply karna, taki correct price aaye  
        // const mrp = ((Number(p.MRP) || 0) * Number(unitPackFactor)); // MRP ko unit pack factor se multiply karna, taki correct price aaye      
        // const price = computePriceFromMrp(mrp); // Price calculate karna using MRP, discount ko consider karte hue
        const stock = Math.floor((Number(p.stock) || 0) / Number(unitPackFactor)); // Stock ko unit pack factor se divide karna, taki correct stock aaye

        const medObj = {
          price,
          mrp: mrp.toFixed(2),
          discount: mrp > 0 ? 15 : 0,
          purchasePrice: purchasePrice,
          stock: stock,
          unitPackFactor: unitPackFactor,
        };

        bulkOps.push({
          updateOne: {
            filter: { batchNumber: p.code },     // If exists → update
            update: {
              $set: medObj
            }                          // If not exists → insert
          }
        });

      }

    }

    // 🚀 BULK WRITE (super fast for both insert + update)
    if (bulkOps.length > 0) {
      await Medicine.bulkWrite(bulkOps, { ordered: false });
    }

    const updateCount = bulkOps.length;
    await Marg.findByIdAndUpdate(createMarg._id, {
      margInsertDataCount: insertCount,
      margUpdateDataCount: updateCount,
      status: 'Completed',
      type: 'Sync Marg Data',
      margInsertData: data
    });

  } catch (err) {
    console.log("Error in Marg import cron:", err);
  }
}

// 👇👇 API HANDLER
export async function POST(request: NextRequest) {

  const latestMarg = await Marg.findOne({
    status: "Completed",
  })
    .sort({ createdAt: -1 })
    .skip(1)
    .lean();

  const lastSyncDateTime = latestMarg
    ? moment(latestMarg.createdAt).tz("Asia/Kolkata")
    : null;

  // current time
  const currentTime = moment().tz("Asia/Kolkata");

  // difference in minutes
  const diffMinutes = lastSyncDateTime
    ? currentTime.diff(lastSyncDateTime, "minutes")
    : null;

  if (diffMinutes !== null && diffMinutes < 20) {
    return NextResponse.json({
      success: false,
      message: `Last sync ${diffMinutes} minutes ago. Please wait 20 minutes.`,
    });
  } else {

    // background me chala do
    setImmediate(() => {
      importMedicinesFromMarg();
    });

    return NextResponse.json({
      success: true,
      message: 'Marg data import started'
    });

  }

}
