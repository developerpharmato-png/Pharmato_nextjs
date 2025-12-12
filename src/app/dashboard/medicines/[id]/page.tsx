"use client";
import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";

import { useParams } from "next/navigation";
import HeaderWithAction from "../../components/HeaderWithAction";
import { CustomButton } from "../../components/miniComponents";
import MedicineDetailSkeleton from "../skeleton/MedicineDetailSkeleton";
import ProductImageSlider from "../../components/ProductImageSlider";
import CrossSellProductsPopup from "../components/CrossSellProductsPopup";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import RelatedProductsPopup from "../components/RelatedProductsPopup";

export default function MedicineDetailPage() {
  const { id } = useParams();
  const [medicine, setMedicine] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tabIndex, setTabIndex] = useState(0);
  const [showRelatedPopup, setShowRelatedPopup] = useState(false);
  const [showCrossSellPopup, setShowCrossSellPopup] = useState(false);
  console.log(showRelatedPopup, "showRelatedPopupshowRelatedPopup");

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
        const res = await fetch(`/api/medicines/${id}`);
        const data = await res.json();
        setMedicine(data.data);
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
      await fetch("/api/medicines/update-related", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medicineId: id, relatedProductIds: ids }),
      });
    } catch (err) {}
    setShowRelatedPopup(false);
    // Refetch medicine detail to update UI
    setLoading(true);
    try {
      const res = await fetch(`/api/medicines/${id}`);
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
      await fetch("/api/medicines/update-cross-sell", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medicineId: id, crossSellProductIds: ids }),
      });
    } catch (err) {}
    setShowCrossSellPopup(false);
    // Refetch medicine detail to update UI
    setLoading(true);
    try {
      const res = await fetch(`/api/medicines/${id}`);
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

  const images: string[] = medicine.images || [];

  return (
    <div className="containerStyle scrollbar-hide">
      <HeaderWithAction
        title={medicine.name}
        subtitle={medicine.manufacturer || ""}
        showBack={true}
        showSearch={false}
        rightNode={
          <div className="flex items-center gap-3">
            <a
              href={`/dashboard/medicines/${id}/edit`}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-medium shadow-md transition duration-150 ease-in-out"
            >
              <span className="material-icons text-base">edit</span>
              <span>Edit</span>
            </a>
            <button
              className={`hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border ${
                medicine.isActive
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-red-50 text-red-700 border-red-200"
              }`}
            >
              <span className="material-icons text-base">
                {medicine.isActive ? "check_circle" : "highlight_off"}
              </span>
              <span>{medicine.isActive ? "Active" : "Inactive"}</span>
            </button>
          </div>
        }
      />
      <div className="bg-white rounded-xl p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)}>
            <Tab label="Gallery" />
            <Tab label="Details" />
            <Tab label="Related Products" />
            <Tab label="Cross-Sell Products" />
          </Tabs>
          <div className="mt-6">
            {tabIndex === 0 && (
              <ProductImageSlider images={images} productName={medicine.name} />
            )}
            {tabIndex === 1 && (
              <div className="space-y-6">
                <div className="flex flex-wrap gap-3 items-center">
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">
                    <span className="material-icons text-sm">category</span>
                    <span>{medicine.categoryId?.name || "Other"}</span>
                  </span>
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold">
                    <span className="material-icons text-sm">
                      local_pharmacy
                    </span>
                    <span>OTC: Yes</span>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-md text-center">
                    <span className="material-icons text-green-600">
                      attach_money
                    </span>
                    <div className="text-xs text-gray-500">Price</div>
                    <div className="text-lg font-bold text-green-700">₹110</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md text-center">
                    <span className="material-icons text-gray-600">
                      inventory_2
                    </span>
                    <div className="text-xs text-gray-500">Stock</div>
                    <div className="text-sm font-semibold">0 units</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md text-center">
                    <span className="material-icons text-orange-500">
                      event
                    </span>
                    <div className="text-xs text-gray-500">Expiry</div>
                    <div className="text-sm">3/1/2027</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md text-center">
                    <span className="material-icons text-gray-600">
                      local_offer
                    </span>
                    <div className="text-xs text-gray-500">Batch</div>
                    <div className="text-sm">1062001</div>
                  </div>
                </div>
                <section className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                  <h2 className="text-lg font-semibold text-gray-800 inline-flex items-center gap-2">
                    <span className="material-icons text-base text-green-600">
                      info
                    </span>
                    Overview
                  </h2>
                  <div className="mt-3 text-gray-700">ZORYL M3 FOR</div>
                  <div className="mt-4">
                    <div className="text-sm font-semibold text-gray-800 mb-2">
                      Highlights
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <div className="px-3 py-1 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded text-sm font-medium">
                        ZORYL M3 FOR
                      </div>
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
                          ₹120
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">
                          Purchase Price
                        </div>
                        <div className="text-lg font-semibold text-red-600">
                          ₹100
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                    <h3 className="text-base font-medium text-gray-700 inline-flex items-center gap-2">
                      <span className="material-icons text-lg text-green-600">
                        attach_money
                      </span>
                      Selling
                    </h3>
                    <div className="mt-3 grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-500">Price</div>
                        <div className="text-2xl font-bold text-green-700">
                          ₹110
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Discount</div>
                        <div className="text-lg font-semibold text-blue-600">
                          8%
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
                      <div className="text-lg font-semibold">0 units</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded text-center border border-gray-200">
                      <div className="text-xs text-gray-500">Expiry</div>
                      <div className="text-sm">3/1/2027</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded text-center border border-gray-200">
                      <div className="text-xs text-gray-500">Batch</div>
                      <div className="text-sm">1062001</div>
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
                  <div className="mt-3 text-gray-700">ZORYL M3 FOR 12g</div>
                </section>
              </div>
            )}
            {tabIndex === 2 && (
              <div>
                <div className="flex justify-between items-center mb-4"></div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {medicine.relatedProducts?.map((prod: any) => (
                    <div
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
                        <div className="text-sm font-semibold truncate text-gray-800">
                          {prod.name}
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
                  {medicine.relatedProducts?.length === 0 && (
                    <div className="col-span-full text-sm text-gray-500 italic">
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
                <div className=" mt-10 flex justify-end">
                  <CustomButton onClick={() => setShowRelatedPopup(true)}>
                    Update
                  </CustomButton>
                </div>
              </div>
            )}
            {tabIndex === 3 && (
              <div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {medicine.crossSellProducts?.map((prod: any) => (
                    <div
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
                        <div className="text-sm font-semibold truncate text-gray-800">
                          {prod.name}
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
                  {medicine.crossSellProducts?.length === 0 && (
                    <div className="col-span-full text-sm text-gray-500 italic">
                      No related products linked.
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
                <div className="mt-10 flex justify-end">
                  <CustomButton onClick={() => setShowCrossSellPopup(true)}>
                    Update
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
