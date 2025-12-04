"use client";
import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";

import { useParams } from "next/navigation";
import HeaderWithAction from "../../components/HeaderWithAction";
import { CustomButton } from "../../components/miniComponents";

type TabKey = "overview" | "pricing" | "inventory" | "composition" | "related";

// Updated to use /api/customer/medicines/detail/{id}
export default function MedicineDetailPage() {
  const { id } = useParams();
  const [medicine, setMedicine] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showRelatedPopup, setShowRelatedPopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Ensure Material Icons font is available for this page
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

  if (loading) return <div className="p-6 text-gray-700">Loading...</div>;
  if (!medicine)
    return <div className="p-6 text-red-600">Medicine not found.</div>;

  const images: string[] = medicine.images || [];

  return (
    <div className="containerStyle scrollbar-hide" >
      <HeaderWithAction
        title={medicine.name}
        subtitle={medicine.manufacturer || ""}
        showBack={false}
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

            {/* Mobile: compact icon buttons */}
            <a
              href={`/dashboard/medicines/${id}/edit`}
              className="sm:hidden inline-flex items-center justify-center w-10 h-10 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full shadow-md"
            >
              <span className="material-icons">edit</span>
            </a>
            <button
              className={`sm:hidden inline-flex items-center justify-center w-10 h-10 rounded-full ${
                medicine.isActive
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
              aria-label="Toggle active"
            >
              <span className="material-icons">
                {medicine.isActive ? "check_circle" : "highlight_off"}
              </span>
            </button>
          </div>
        }
      />

      <div>
        <div className="bg-white rounded-xl  p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {" "}
          {/* Enhanced shadow and padding */}
          <div className="lg:col-span-1">
            <div className="rounded-lg overflow-hidden border border-gray-200 bg-gray-50 shadow-inner">
              {images.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setLightboxIndex(0)}
                  className="w-full block transition-opacity hover:opacity-90"
                >
                  <img
                    src={images[0]}
                    alt={medicine.name}
                    className="w-full h-72 lg:h-96 object-cover"
                  />
                </button>
              ) : (
                <div className="w-full h-72 lg:h-96 flex flex-col items-center justify-center text-8xl text-green-500 bg-gray-100">
                  <span className="material-icons text-8xl">medication</span>
                  {/* <span className="text-base text-gray-500 mt-2">No Image Available</span> // REMOVED: Preserving original no-image state */}
                </div>
              )}
            </div>
            <div className="mt-4 overflow-x-auto">
              <div className="flex gap-3 items-center">
                {images.length > 0 ? (
                  images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setLightboxIndex(idx)}
                      className="w-20 h-20 rounded-md overflow-hidden border-2 transition-all duration-200 ease-in-out hover:border-green-500 focus:border-green-600 flex-shrink-0"
                    >
                      <img
                        src={img}
                        alt={`thumb-${idx}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-500 p-2">
                    <span className="material-icons text-base">
                      photo_camera
                    </span>
                    <span>No images</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Right: info + tabs */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="flex-1">
                <div className="text-gray-700 text-sm sm:text-base mb-3">
                  {medicine.description}
                </div>{" "}
                {/* Original description styling/location preserved */}
                <div className="flex flex-wrap gap-3 items-center">
                  {/* Tags styling enhanced */}
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">
                    <span className="material-icons text-sm">category</span>
                    <span>
                      {medicine.categoryId?.name || medicine.category}
                    </span>
                  </span>
                  {medicine.subCategoryId?.name && (
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-semibold">
                      <span className="material-icons text-sm">
                        subdirectory_arrow_right
                      </span>
                      <span>{medicine.subCategoryId.name}</span>
                    </span>
                  )}
                  <span
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
                      medicine.isOTC
                        ? "bg-green-50 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <span className="material-icons text-sm">
                      {medicine.isOTC ? "local_pharmacy" : "medical_services"}
                    </span>
                    <span>OTC: {medicine.isOTC ? "Yes" : "No"}</span>
                  </span>
                </div>
              </div>

              <div className="w-full md:w-64 flex-shrink-0">
                {" "}
                {/* Width/shrink kept as original */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 p-3 rounded-md text-center flex flex-col items-center gap-1">
                    <span className="material-icons text-green-600">
                      attach_money
                    </span>
                    <div className="text-xs text-gray-500">Price</div>
                    <div className="text-lg font-bold text-green-700">
                      ₹{medicine.price}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md text-center flex flex-col items-center gap-1">
                    <span className="material-icons text-gray-600">
                      inventory_2
                    </span>
                    <div className="text-xs text-gray-500">Stock</div>
                    <div className="text-sm font-semibold">
                      {medicine.stock} units
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md text-center flex flex-col items-center gap-1">
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
                  <div className="bg-gray-50 p-3 rounded-md text-center flex flex-col items-center gap-1">
                    <span className="material-icons text-gray-600">
                      local_offer
                    </span>
                    <div className="text-xs text-gray-500">Batch</div>
                    <div className="text-sm">{medicine.batchNumber || "-"}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sections: Overview, Pricing, Inventory, Composition, Related */}
            <div className="mt-4 space-y-6">
              {" "}
              {/* Increased section spacing to 6 */}
              {/* Overview / Highlights */}
              <section className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                {" "}
                {/* Enhanced styling */}
                <div className="flex items-center justify-between border-b pb-2 mb-3">
                  {" "}
                  {/* Added separator */}
                  <h2 className="text-lg font-semibold text-gray-800 inline-flex items-center gap-2">
                    <span className="material-icons text-base text-green-600">
                      info
                    </span>{" "}
                    Overview
                  </h2>
                  {/* small action can be added here if needed */}
                </div>
                <div className="mt-3 text-gray-700">{medicine.description}</div>
                {medicine.highlights && medicine.highlights.length > 0 && (
                  <div className="mt-4">
                    <div className="text-sm font-semibold text-gray-800 mb-2">
                      Highlights
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {medicine.highlights.map((h: string, idx: number) => (
                        <div
                          key={idx}
                          className="px-3 py-1 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded text-sm font-medium"
                        >
                          {h}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
              {/* Pricing */}
              <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {" "}
                {/* Increased gap */}
                <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                  <div className="flex items-center justify-between border-b pb-2 mb-3">
                    <h3 className="text-base font-medium text-gray-700 inline-flex items-center gap-2">
                      <span className="material-icons text-lg text-green-600">
                        sell
                      </span>{" "}
                      Pricing
                    </h3>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-4">
                    {" "}
                    {/* Adjusted grid layout and spacing for better readability */}
                    <div>
                      <div className="text-sm text-gray-500">MRP</div>
                      <div className="text-lg font-semibold text-gray-800">
                        ₹{medicine.mrp || "-"}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">
                        Purchase Price
                      </div>
                      <div className="text-lg font-semibold text-red-600">
                        ₹{medicine.purchasePrice || "-"}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                  <div className="flex items-center justify-between border-b pb-2 mb-3">
                    <h3 className="text-base font-medium text-gray-700 inline-flex items-center gap-2">
                      <span className="material-icons text-lg text-green-600">
                        attach_money
                      </span>{" "}
                      Selling
                    </h3>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-4">
                    {" "}
                    {/* Adjusted grid layout */}
                    <div>
                      <div className="text-sm text-gray-500">Price</div>
                      <div className="text-2xl font-bold text-green-700">
                        ₹{medicine.price}
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
              {/* Inventory */}
              <section className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                <div className="flex items-center justify-between border-b pb-2 mb-3">
                  <h3 className="text-base font-medium text-gray-700 inline-flex items-center gap-2">
                    <span className="material-icons text-lg text-green-600">
                      inventory_2
                    </span>{" "}
                    Inventory
                  </h3>
                  <div className="text-sm text-gray-500">Status</div>{" "}
                  {/* Kept the original 'Status' text */}
                </div>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-gray-50 p-3 rounded text-center border border-gray-200">
                    <div className="text-xs text-gray-500">Stock</div>
                    <div className="text-lg font-semibold">
                      {medicine.stock} units
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
                    <div className="text-sm">{medicine.batchNumber || "-"}</div>
                  </div>
                </div>
              </section>
              {/* Composition */}
              <section className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                <div className="flex items-center justify-between border-b pb-2 mb-3">
                  <h3 className="text-base font-medium text-gray-700 inline-flex items-center gap-2">
                    <span className="material-icons text-lg text-green-600">
                      science
                    </span>{" "}
                    Composition
                  </h3>
                </div>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {" "}
                  {/* Increased gap */}
                  {medicine.composition?.length ? (
                    medicine.composition.map((c: any, idx: number) => (
                      <div
                        key={idx}
                        className="bg-gray-50 p-3 rounded-md border border-gray-200"
                      >
                        <div className="text-sm font-semibold">{c.name}</div>
                        <div className="text-sm text-gray-600">{c.value}</div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-sm text-gray-500 italic">
                      No composition data available.
                    </div>
                  )}
                </div>
              </section>
              {/* Related Products */}
              <section className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4 border-b pb-2">
                  <h3 className="text-base font-medium text-gray-700 inline-flex items-center gap-2">
                    <span className="material-icons text-lg text-green-600">
                      link
                    </span>{" "}
                    Related Products
                  </h3>
                  <CustomButton onClick={() => setShowRelatedPopup(true)}>
                    Update
                  </CustomButton>
                </div>
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {" "}
                  {/* Increased gap for cards */}
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
              </section>
            </div>
          </div>
        </div>
      </div>

      {showRelatedPopup && (
        <RelatedProductsPopup
          categoryId={medicine.categoryId?._id || medicine.categoryId}
          selected={
            medicine.relatedProducts?.map((prod: any) => prod._id) || []
          }
          onClose={() => setShowRelatedPopup(false)}
          onUpdate={handleUpdateRelatedProducts}
        />
      )}

      {/* Simple lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 transition-opacity"
          onClick={() => setLightboxIndex(null)}
        >
          <div
            className="max-w-4xl max-h-[90vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={images[lightboxIndex]}
              alt={`lightbox-${lightboxIndex}`}
              className="w-full h-auto max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
            <button
              onClick={() => setLightboxIndex(null)}
              className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300 transition-colors"
            >
              <span className="material-icons">close</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
function RelatedProductsPopup({
  categoryId,
  selected,
  onClose,
  onUpdate,
}: {
  categoryId: string;
  selected: string[];
  onClose: () => void;
  onUpdate: (ids: string[]) => void;
}) {
  const [products, setProducts] = React.useState<
    { _id: string; name: string }[]
  >([]);
  const [checked, setChecked] = React.useState<string[]>(selected);
  const [loading, setLoading] = React.useState(true);
  // Get current medicineId from selected (first one is always the current medicine)
  const currentMedicineId =
    typeof window !== "undefined"
      ? window.location.pathname.split("/").pop()
      : "";

  React.useEffect(() => {
    fetch(`/api/medicines/by-category/${categoryId}`)
      .then((res) => res.json())
      .then((data) => {
        // Exclude current medicine from list
        const filtered = (data.data || []).filter(
          (prod: any) => prod._id !== currentMedicineId
        );
        setProducts(filtered);
        setLoading(false);
      });
  }, [categoryId, currentMedicineId]);

  const handleCheck = (id: string) => {
    if (checked.includes(id)) {
      setChecked((prev) => prev.filter((x) => x !== id));
    } else {
      if (checked.length < 5) {
        setChecked((prev) => [...prev, id]);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backdropFilter: "blur(10px)", background: "rgba(0,0,0,0.4)" }}
    >
      {" "}
      {/* Darker backdrop */}
      <div className="bg-white rounded-xl shadow-2xl p-6 md:p-8 w-full max-w-lg transform transition-all duration-300 ease-out">
        <h2 className="text-2xl font-bold text-gray-800 mb-5 border-b pb-3">
          Select Related Products
        </h2>
        {loading ? (
          <div className="p-4 text-center text-gray-600">
            Loading products...
          </div>
        ) : (
          <div className="flex flex-col gap-1 max-h-80 overflow-y-auto pr-2">
            {" "}
            {/* Added max-height and scrollbar */}
            {products.map((prod) => (
              <label
                key={prod._id}
                className={`flex items-center gap-3 py-2 px-3 rounded-lg transition-colors duration-150 ease-in-out ${
                  checked.includes(prod._id)
                    ? "bg-green-50 border border-green-200"
                    : "hover:bg-gray-100"
                } ${
                  checked.length >= 5 && !checked.includes(prod._id)
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked.includes(prod._id)}
                  onChange={() => handleCheck(prod._id)}
                  className="accent-green-600 w-5 h-5 rounded"
                  disabled={checked.length >= 5 && !checked.includes(prod._id)}
                />
                <span className="font-medium text-gray-800 text-base flex-1">
                  {prod.name}
                </span>
              </label>
            ))}
            {products.length === 0 && (
              <div className="text-sm text-gray-500 p-4 text-center">
                No other products found in this category.
              </div>
            )}
            <div className="text-right text-xs text-gray-500 mt-2">
              Selected: {checked.length} / 5
            </div>
            {checked.length >= 5 && (
              <div className="text-red-600 text-sm mt-2 text-center font-medium">
                ⚠️ Maximum 5 products can be selected.
              </div>
            )}
          </div>
        )}
        <div className="flex gap-4 mt-6 justify-end pt-4 border-t">
          <button
            className="px-5 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-100 transition duration-150"
            onClick={onClose}
          >
            Cancel
          </button>
          <CustomButton
          width="200px"
             onClick={() => onUpdate(checked)}
          >
            Save Changes
          </CustomButton>
        </div>
      </div>
    </div>
  );
}
