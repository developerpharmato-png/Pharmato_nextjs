"use client";
import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";

import { useParams, useRouter } from "next/navigation";
import HeaderWithAction from "../../components/HeaderWithAction";
import { CustomButton, CustomTooltip } from "../../components/miniComponents";
import MedicineDetailSkeleton from "../skeleton/MedicineDetailSkeleton";
import ProductImageSlider from "../../components/ProductImageSlider";
import CrossSellProductsPopup from "../components/CrossSellProductsPopup";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import RelatedProductsPopup from "../components/RelatedProductsPopup";
import { MedicinesGetBYIDPath } from "../../storeAPICall/API/BaseApi";
import { Box } from "@mui/material";

export default function MedicineDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [medicine, setMedicine] = useState<any>(null);
  const [previousMedicine, setPreviousMedicine] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tabIndex, setTabIndex] = useState(0);
  const [showRelatedPopup, setShowRelatedPopup] = useState(false);
  const [showCrossSellPopup, setShowCrossSellPopup] = useState(false);
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    const p = localStorage.getItem("adminPermissions");
    if (p) {
      try {
        const perms = JSON.parse(p);
        const medicinePerm = perms["Medicines"];
        setCanEdit(medicinePerm ? medicinePerm.edit : false);
      } catch (e) {
        setCanEdit(false);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!document.getElementById("material-icons-stylesheet")) {
      const link = document.createElement("link");
      link.id = "material-icons-stylesheet";
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/icon?family=Material+Icons";
      document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    async function fetchMedicine() {
      try {
        const res = await fetch(`${MedicinesGetBYIDPath}${id}`);
        const data = await res.json();
        setMedicine(data.data);
        setPreviousMedicine(data.data.previousMargData || null);
      } catch (err) {
        setMedicine(null);
      } finally {
        setLoading(false);
      }
    }
    fetchMedicine();
  }, [id]);

  const handleUpdateRelatedProducts = async (ids: string[]) => {
    try {
      await fetch("/api/admin/medicines/update-related", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medicineId: id, relatedProductIds: ids }),
      });
    } catch (err) { }
    setShowRelatedPopup(false);
    // Refetch medicine detail to update UI
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/medicines/${id}`);
      const data = await res.json();
      setMedicine(data.data);
    } catch (err) {
      setMedicine(null);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCrossSellProducts = async (ids: string[]) => {
    try {
      await fetch("/api/admin/medicines/update-cross-sell", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medicineId: id, crossSellProductIds: ids }),
      });
    } catch (err) { }
    setShowCrossSellPopup(false);
    // Refetch medicine detail to update UI
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/medicines/${id}`);
      const data = await res.json();
      setMedicine(data.data);
    } catch (err) {
      setMedicine(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="containerStyle scrollbar-hide">
        <MedicineDetailSkeleton />
      </div>
    );
  if (!medicine)
    return <div className="p-6 text-red-600">Medicine not found.</div>;

  const images: string[] = (() => {
    const imgs = Array.isArray(medicine.images) ? [...medicine.images] : [];
    const cover = medicine.coverImage;
    if (cover) {
      const filtered = imgs.filter((u) => u !== cover);
      return [cover, ...filtered];
    }
    return imgs;
  })();

  const mediumDetails = (id: string) => {
    router.push(`/dashboard/medicines/${id}`);
  };

  return (
    <div className="containerStyle scrollbar-hide">
      <HeaderWithAction
        title={medicine.name}
        subtitle={medicine.manufacturer || ""}
        showBack={true}
        showSearch={false}
        rightNode={
          <div className="flex items-center gap-2 sm:gap-3">
            {canEdit && (
              <a
                href={`/dashboard/medicines/AddEdit/${id}`}
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-xs sm:text-sm font-medium shadow-md transition duration-150 ease-in-out"
              >
                <span className="material-icons text-sm sm:text-base">edit</span>
                <span>Edit</span>
              </a>
            )}
            <button
              className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium border ${medicine.isActive
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-red-50 text-red-700 border-red-200"
                }`}
            >
              <span className="material-icons text-sm sm:text-base">
                {medicine.isActive ? "check_circle" : "highlight_off"}
              </span>
              <span>{medicine.isActive ? "Active" : "Inactive"}</span>
            </button>
          </div>
        }
      />
      <div className="bg-white rounded-xl p-6 md:p-8 grid  gap-8">
        <div className="lg:col-span-2 overflow-hidden">
          <Box sx={{ borderBottom: 1, borderColor: 'divider', width: '100%' }}>
            <Tabs
              value={tabIndex}
              onChange={(_, v) => setTabIndex(v)}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              aria-label="medicine details tabs"
            >
              <Tab label="Gallery" />
              <Tab label="Details" />
              <Tab label="Previous Details" />
              <Tab label="Related Products" />
              <Tab label="Cross-Sell Products" />
            </Tabs>
          </Box>
          <div className="mt-6">
            {tabIndex === 0 && (
              <ProductImageSlider images={images} productName={medicine.name} />
            )}
            {tabIndex === 1 && (
              <div className="space-y-6">
                <div className="flex flex-wrap gap-3 items-center">
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">
                    <span className="material-icons text-sm">category</span>
                    <span>{medicine.category || "Other"}</span>
                  </span>
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold">
                    <span className="material-icons text-sm">
                      local_pharmacy
                    </span>
                    <span>OTC: {medicine.isOTC ? "Yes" : "No"}</span>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-md text-center">
                    <span className="material-icons text-green-600">
                      ₹
                    </span>
                    <div className="text-xs text-gray-500">Price</div>
                    <div className="text-lg font-bold text-green-700">
                      ₹{medicine.price ?? 0}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md text-center">
                    <span className="material-icons text-gray-600">
                      inventory_2
                    </span>
                    <div className="text-xs text-gray-500">Stock</div>
                    <div className="text-sm font-semibold">
                      {medicine.stock ?? 0} units
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md text-center">
                    <span className="material-icons text-orange-500">
                      event
                    </span>
                    <div className="text-xs text-gray-500">Expiry</div>
                    <div className="text-sm">
                      {medicine.expiryDate
                        ? new Date(medicine.expiryDate).toLocaleDateString()
                        : "-"}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md text-center">
                    <span className="material-icons text-gray-600">
                      local_offer
                    </span>
                    <div className="text-xs text-gray-500">Batch</div>
                    <div className="text-sm">{medicine.batchNumber || "-"}</div>
                  </div>
                </div>
                <section className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                  <h2 className="text-lg font-semibold text-gray-800 inline-flex items-center gap-2">
                    <span className="material-icons text-base text-green-600">
                      info
                    </span>
                    Overview
                  </h2>
                  <div className="mt-3 text-gray-700">
                    {medicine.description}
                  </div>
                  <div className="mt-4">
                    <div className="text-sm font-semibold text-gray-800 mb-2">
                      Highlights
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {medicine.highlights && medicine.highlights.length > 0 ? (
                        medicine.highlights.map((h: string, i: number) => (
                          <div
                            key={i}
                            className="px-3 py-1 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded text-sm font-medium"
                          >
                            {h}
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-1 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded text-sm font-medium">
                          No highlights
                        </div>
                      )}
                    </div>
                  </div>
                </section>
                <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                    <h3 className="text-base font-medium text-gray-700 inline-flex items-center gap-2">
                      <span className="material-icons text-lg text-green-600">
                        sell
                      </span>
                      Pricing
                    </h3>
                    <div className="mt-3 grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-500">MRP</div>
                        <div className="text-lg font-semibold text-gray-800">
                          ₹{medicine.mrp ?? 0}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">
                          Purchase Price
                        </div>
                        <div className="text-lg font-semibold text-red-600">
                          ₹{medicine.purchasePrice ?? 0}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                    <h3 className="text-base font-medium text-gray-700 inline-flex items-center gap-2">
                      <span className="material-icons text-lg text-green-600">
                        ₹
                      </span>
                      Selling
                    </h3>
                    <div className="mt-3 grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-500">Price</div>
                        <div className="text-2xl font-bold text-green-700">
                          ₹{medicine.price ?? 0}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Discount</div>
                        <div className="text-lg font-semibold text-blue-600">
                          {medicine.discount ?? 0}%
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
                <section className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                  <h3 className="text-base font-medium text-gray-700 inline-flex items-center gap-2">
                    <span className="material-icons text-lg text-green-600">
                      inventory_2
                    </span>
                    Inventory
                  </h3>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-gray-50 p-3 rounded text-center border border-gray-200">
                      <div className="text-xs text-gray-500">Stock</div>
                      <div className="text-lg font-semibold">
                        {medicine.stock ?? 0} units
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded text-center border border-gray-200">
                      <div className="text-xs text-gray-500">Expiry</div>
                      <div className="text-sm">
                        {medicine.expiryDate
                          ? new Date(medicine.expiryDate).toLocaleDateString()
                          : "-"}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded text-center border border-gray-200">
                      <div className="text-xs text-gray-500">Batch</div>
                      <div className="text-sm">
                        {medicine.batchNumber || "-"}
                      </div>
                    </div>
                  </div>
                </section>
                <section className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                  <h3 className="text-base font-medium text-gray-700 inline-flex items-center gap-2">
                    <span className="material-icons text-lg text-green-600">
                      science
                    </span>
                    Composition
                  </h3>
                  <div className="mt-3 text-gray-700">
                    {medicine.composition && medicine.composition.length > 0 ? (
                      <ul className="list-disc pl-5 space-y-1">
                        {medicine.composition.map((c: any, i: number) =>
                          c.name || c.value ? (
                            <li key={c._id || i}>
                              {c.name}
                              {c.name && c.value ? ": " : ""}
                              {c.value}
                            </li>
                          ) : null
                        )}
                      </ul>
                    ) : (
                      medicine.margData?.Salt || "No composition info"
                    )}
                  </div>
                </section>
              </div>
            )}
            {tabIndex === 2 && (
              <div className="space-y-6">
                <div className="flex flex-wrap gap-3 items-center">
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">
                    <span className="material-icons text-sm">category</span>
                    <span>{previousMedicine?.category || "Other"}</span>
                  </span>
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold">
                    <span className="material-icons text-sm">
                      local_pharmacy
                    </span>
                    <span>OTC: {previousMedicine?.isOTC ? "Yes" : "No"}</span>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-md text-center">
                    <span className="material-icons text-green-600">
                      ₹
                    </span>
                    <div className="text-xs text-gray-500">Price</div>
                    <div className="text-lg font-bold text-green-700">
                      ₹{previousMedicine?.price ?? 0}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md text-center">
                    <span className="material-icons text-gray-600">
                      inventory_2
                    </span>
                    <div className="text-xs text-gray-500">Stock</div>
                    <div className="text-sm font-semibold">
                      {previousMedicine?.stock ?? 0} units
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md text-center">
                    <span className="material-icons text-orange-500">
                      event
                    </span>
                    <div className="text-xs text-gray-500">Expiry</div>
                    <div className="text-sm">
                      {previousMedicine?.expiryDate
                        ? new Date(previousMedicine?.expiryDate).toLocaleDateString()
                        : "-"}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md text-center">
                    <span className="material-icons text-gray-600">
                      local_offer
                    </span>
                    <div className="text-xs text-gray-500">Batch</div>
                    <div className="text-sm">{previousMedicine?.batchNumber || "-"}</div>
                  </div>
                </div>
                <section className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                  <h2 className="text-lg font-semibold text-gray-800 inline-flex items-center gap-2">
                    <span className="material-icons text-base text-green-600">
                      info
                    </span>
                    Overview
                  </h2>
                  <div className="mt-3 text-gray-700">
                    {previousMedicine?.description}
                  </div>
                  <div className="mt-4">
                    <div className="text-sm font-semibold text-gray-800 mb-2">
                      Highlights
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {previousMedicine?.highlights && previousMedicine?.highlights.length > 0 ? (
                        previousMedicine?.highlights.map((h: string, i: number) => (
                          <div
                            key={i}
                            className="px-3 py-1 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded text-sm font-medium"
                          >
                            {h}
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-1 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded text-sm font-medium">
                          No highlights
                        </div>
                      )}
                    </div>
                  </div>
                </section>
                <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                    <h3 className="text-base font-medium text-gray-700 inline-flex items-center gap-2">
                      <span className="material-icons text-lg text-green-600">
                        sell
                      </span>
                      Pricing
                    </h3>
                    <div className="mt-3 grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-500">MRP</div>
                        <div className="text-lg font-semibold text-gray-800">
                          ₹{previousMedicine?.mrp ?? 0}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">
                          Purchase Price
                        </div>
                        <div className="text-lg font-semibold text-red-600">
                          ₹{previousMedicine?.purchasePrice ?? 0}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                    <h3 className="text-base font-medium text-gray-700 inline-flex items-center gap-2">
                      <span className="material-icons text-lg text-green-600">
                        ₹
                      </span>
                      Selling
                    </h3>
                    <div className="mt-3 grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-500">Price</div>
                        <div className="text-2xl font-bold text-green-700">
                          ₹{previousMedicine?.price ?? 0}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Discount</div>
                        <div className="text-lg font-semibold text-blue-600">
                          {previousMedicine?.discount ?? 0}%
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
                <section className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                  <h3 className="text-base font-medium text-gray-700 inline-flex items-center gap-2">
                    <span className="material-icons text-lg text-green-600">
                      inventory_2
                    </span>
                    Inventory
                  </h3>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-gray-50 p-3 rounded text-center border border-gray-200">
                      <div className="text-xs text-gray-500">Stock</div>
                      <div className="text-lg font-semibold">
                        {previousMedicine?.stock ?? 0} units
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded text-center border border-gray-200">
                      <div className="text-xs text-gray-500">Expiry</div>
                      <div className="text-sm">
                        {previousMedicine?.expiryDate
                          ? new Date(previousMedicine?.expiryDate).toLocaleDateString()
                          : "-"}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded text-center border border-gray-200">
                      <div className="text-xs text-gray-500">Batch</div>
                      <div className="text-sm">
                        {previousMedicine?.batchNumber || "-"}
                      </div>
                    </div>
                  </div>
                </section>
                <section className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                  <h3 className="text-base font-medium text-gray-700 inline-flex items-center gap-2">
                    <span className="material-icons text-lg text-green-600">
                      science
                    </span>
                    Composition
                  </h3>
                  <div className="mt-3 text-gray-700">
                    {previousMedicine?.composition && previousMedicine?.composition.length > 0 ? (
                      <ul className="list-disc pl-5 space-y-1">
                        {previousMedicine?.composition.map((c: any, i: number) =>
                          c.name || c.value ? (
                            <li key={c._id || i}>
                              {c.name}
                              {c.name && c.value ? ": " : ""}
                              {c.value}
                            </li>
                          ) : null
                        )}
                      </ul>
                    ) : (
                      previousMedicine?.margData?.Salt || "No composition info"
                    )}
                  </div>
                </section>
              </div>
            )}
            {tabIndex === 3 && (
              <div>
                <div className="flex items-center mb-4"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {medicine.relatedProducts?.map((prod: any) => (
                    <div
                      onClick={() => mediumDetails(prod._id)}
                      key={prod._id}
                      className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition"
                    >
                      <div className="h-36 w-full bg-gray-100 flex items-center justify-center">
                        {prod.images?.[0] ? (
                          <img
                            src={prod.images?.[0]}
                            alt={prod.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="material-icons text-3xl text-gray-400">
                            image_not_supported
                          </span>
                        )}
                      </div>
                      <div className="p-3">
                        <div className="truncate">
                          <CustomTooltip title={prod.name || "-"}>
                            <span className="">{prod.name || "-"}</span>
                          </CustomTooltip>
                        </div>

                        <div className="text-xs text-gray-500">
                          {prod.manufacturer}
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="text-green-700 font-bold">
                            ₹{prod.price}
                          </div>
                          {prod.mrp && prod.mrp > prod.price && (
                            <div className="text-xs text-gray-400 line-through">
                              ₹{prod.mrp}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!medicine.relatedProducts || medicine.relatedProducts?.length === 0) && (
                    <div className="col-span-full text-sm text-gray-500 italic text-center">
                      No related products linked.
                    </div>
                  )}
                </div>
                {showRelatedPopup && (
                  <RelatedProductsPopup
                    categoryId={medicine.categoryId}
                    selected={
                      medicine.relatedProducts?.map((prod: any) => prod._id) ||
                      []
                    }
                    onClose={() => setShowRelatedPopup(false)}
                    onUpdate={handleUpdateRelatedProducts}
                  />
                )}
                <div className="mt-10 flex justify-center">
                  <CustomButton onClick={() => setShowRelatedPopup(true)}>
                    {medicine.relatedProducts && medicine.relatedProducts.length > 0
                      ? "Update"
                      : "Add"}
                  </CustomButton>
                </div>
              </div>
            )}
            {tabIndex === 4 && (
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {medicine.crossSellProducts?.map((prod: any) => (
                    <div
                      key={prod._id}
                      onClick={() => mediumDetails(prod._id)}
                      className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition"
                    >
                      <div className="h-36 w-full bg-gray-100 flex items-center justify-center">
                        {prod.images?.[0] ? (
                          <img
                            src={prod.images?.[0]}
                            alt={prod.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="material-icons text-3xl text-gray-400">
                            image_not_supported
                          </span>
                        )}
                      </div>
                      <div className="p-3">
                        <div className="truncate">
                          <CustomTooltip title={prod.name || "-"}>
                            <span className="">{prod.name || "-"}</span>
                          </CustomTooltip>
                        </div>
                        <div className="text-xs text-gray-500">
                          {prod.manufacturer}
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="text-green-700 font-bold">
                            ₹{prod.price}
                          </div>
                          {prod.mrp && prod.mrp > prod.price && (
                            <div className="text-xs text-gray-400 line-through">
                              ₹{prod.mrp}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!medicine.crossSellProducts || medicine.crossSellProducts?.length === 0) && (
                    <div className="col-span-full text-sm text-gray-500 italic text-center">
                      No cross-sell products linked.
                    </div>
                  )}
                  {showCrossSellPopup && (
                    <CrossSellProductsPopup
                      categoryId={medicine.categoryId}
                      selected={
                        medicine.crossSellProducts?.map((p: any) => p._id) || []
                      }
                      onClose={() => setShowCrossSellPopup(false)}
                      onUpdate={handleUpdateCrossSellProducts}
                    />
                  )}
                </div>
                <div className="mt-10 flex justify-center">
                  <CustomButton onClick={() => setShowCrossSellPopup(true)}>
                    {medicine.crossSellProducts && medicine.crossSellProducts.length > 0
                      ? "Update"
                      : "Add"}
                  </CustomButton>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
