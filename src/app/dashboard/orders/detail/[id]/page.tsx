"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import HeaderWithAction from "../../../components/HeaderWithAction";
import { CustomImage, ModalHeader } from "../../../components/miniComponents";
import Swal from "sweetalert2";

import { OrderDetailsStore } from "../../../storeAPICall/useUserStore";
import { OrderDetailPath } from "../../../storeAPICall/API/BaseApi";
import { downloadImageByUrl, getStatusColor } from "@/utils/function";
import PartialCancel from "@/app/dashboard/components/skeleton/PartialCancel";
import { Mail, Phone } from "lucide-react";
import { MdEmail } from "react-icons/md";

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const {
    postData: fetchDetailsPost,
    data: detailsData,
    loading: detailsLoading,
  } = OrderDetailsStore();

  useEffect(() => {
    if (orderId) {
      fetchOrderDetail();
    }
  }, [orderId]);

  const fetchOrderDetail = async () => {
    setLoading(true);
    try {
      await fetchDetailsPost(OrderDetailPath, { orderId });
    } catch (e) {
      // handled in detailsData effect
    } finally {
      setLoading(false);
    }
  };

  // Download image by fetching blob (works for cross-origin URLs when allowed)

  useEffect(() => {
    if (!detailsData) return;
    const success = (detailsData as any).success;
    if (success) {
      setOrder((detailsData as any).data);
    } else {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: (detailsData as any).message || "Failed to fetch order details",
      });
      router.push("/dashboard/orders");
    }
  }, [detailsData]);

  if (loading) {
    return (
      <div className="scrollbar-hide containerStyle">
        <PartialCancel />
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const medidetails = (_id: String) => {
    router.push(`/dashboard/medicines/${_id}`);
  };

  const acceptedCount =
    order?.medicineId?.filter((m: any) => m.status !== "cancelled").length || 0;
  const rejectedCount =
    order?.medicineId?.filter((m: any) => m.status === "cancelled").length || 0;

  return (
    <div className="containerStyle scrollbar-hide">
      <HeaderWithAction
        title="Order Details"
        subtitle={`Order ID: ${order?.order_id}`}
        showBack={true}
        onBack={() => router.push("/dashboard/orders")}
        showSearch={false}
        addShow={false}
        isunsaved={false}
        rightNode={
          <button
            className="ml-2 px-4 py-2 rounded-lg font-bold transition"
            style={{
              background: "var(--primary)",
              color: "#fff",
            }}
            onClick={() =>
              router.push(`/dashboard/orders/detail/${orderId}/partial-cancel`)
            }
          >
            Manage Order
          </button>
        }
      />

      <div className="space-y-6">
        {/* Order Summary Card */}
        {/* Order Summary Card */}
        <div className="bg-[var(--background)] rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-bold mb-6 text-[var(--foreground)] border-b border-gray-100 pb-3">
              Order Summary
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Column 1: Core Order Details */}
              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Order ID
                    </p>
                    <p className="font-mono text-sm text-[var(--primary)] font-bold">
                      {order?.order_id}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Payment ID
                    </p>
                    <p className="font-mono text-xs text-gray-600 break-all bg-gray-50 p-1 rounded">
                      {order?.payment_id || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Date & Time
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(order?.createdAt).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Payment Mode
                    </p>
                    <p className="text-sm font-semibold capitalize text-gray-900 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[var(--secondary)]"></span>
                      {order?.payment_mode || "Not Selected"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                      Payment Status
                    </p>
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-tighter ${getStatusColor(
                        order?.payment_status
                      )}`}
                    >
                      {order?.payment_status || "Pending"}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                      Order Status
                    </p>
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-tighter ${getStatusColor(
                        order?.order_status
                      )}`}
                    >
                      {order?.order_status || "Pending"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Column 2: Delivery Address with Map Navigation */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 relative group">
                <div className="flex justify-between items-start mb-3">
                  <p className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-wider">
                    Delivery Address
                  </p>
                  <span className="text-[10px] px-2 py-0.5 bg-white border border-gray-200 rounded text-gray-500 font-bold uppercase">
                    {order?.deliveredAddress?.addressType || "Home"}
                  </span>
                </div>

                <div className="space-y-1">
                  <p className="font-bold text-gray-900">
                    {order?.deliveredAddress?.name}
                  </p>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {order?.deliveredAddress?.address?.houseNumber},{" "}
                    {order?.deliveredAddress?.address?.street}
                    <br />
                    {order?.deliveredAddress?.address?.locality &&
                      `${order?.deliveredAddress?.address?.locality}, `}
                    {order?.deliveredAddress?.address?.city} -{" "}
                    {order?.deliveredAddress?.address?.pinCode}
                    <br />
                    {order?.deliveredAddress?.address?.state}
                  </p>
                  {order?.deliveredAddress?.address?.landmark && (
                    <p className="text-xs text-gray-400 mt-2 italic">
                      Landmark: {order?.deliveredAddress?.address?.landmark}
                    </p>
                  )}

                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-lg bg-[var(--status-info-bg)] text-[var(--status-info-text)]">
                      <Phone />
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      {order?.deliveredAddress?.countryCode || "+91"}{" "}
                      {order?.deliveredAddress?.phone}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Left Column: Customer Details */}
          {order?.userId && (
            <div className="bg-[var(--background)] rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
              <div className="p-6 flex-1">
                <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-3">
                  <div className="p-2 bg-[var(--status-info-bg)] rounded-lg">
                    <svg
                      className="w-5 h-5 text-[var(--status-info-text)]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-[var(--foreground)]">
                    Customer Details
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Email */}
                  <div className="group">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                      Email ID
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded-lg bg-[var(--status-info-bg)] text-[var(--status-info-text)]">
                        <Mail />
                      </span>
                      <span
                        className="text-sm text-[var(--status-info-text)] truncate"
                        title={order?.userId?.email || "No email provided"}
                      >
                        {order?.userId?.email || "No email provided"}
                      </span>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="group">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                      Mobile Number
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded-lg bg-[var(--status-info-bg)] text-[var(--status-info-text)]">
                        <Phone />
                      </span>
                      <span className="text-sm font-bold text-gray-900">
                        {order?.userId?.mobile
                          ? `+91 ${order.userId.mobile}`
                          : "N/A"}
                      </span>
                    </div>
                  </div>

                  {/* Delivery Address */}
                  {order?.delivery_address &&
                    Object.keys(order?.delivery_address).length > 0 && (
                      <div className="sm:col-span-2 mt-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                          Primary Shipping Reference
                        </p>
                        <div className="p-4 bg-gray-50 border border-dashed border-gray-200 rounded-xl flex items-start gap-3">
                          <svg
                            className="w-5 h-5 text-gray-400 mt-0.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                          </svg>
                          <p className="text-sm text-gray-600 leading-relaxed italic">
                            {Object.values(order?.delivery_address)
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                        </div>
                      </div>
                    )}
                </div>
              </div>
              <div className="h-1 w-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] opacity-20"></div>
            </div>
          )}

          {/* Right Column: Prescription Management */}
          <div className="bg-[var(--background)] rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
            <h2 className="text-xl font-bold mb-6 text-[var(--foreground)] border-b border-gray-100 pb-3">
              Prescription Management
            </h2>

            <div className="space-y-6 flex-1">
              {/* Status */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Current Status
                  </p>
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                    {order?.prescription_status || "Pending"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-[var(--background)] rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold mb-5 text-[var(--foreground)] border-b border-gray-100 pb-3 flex justify-between items-center">
            Items in Order
            <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
              {order?.medicineId?.length || 0}{" "}
              {order?.medicineId?.length === 1 ? "item" : "items"}
            </span>
          </h2>

          {order?.coupon_code && (
            <div className="mb-6 p-4 bg-[var(--status-success-bg)] border border-[var(--secondary)]/20 rounded-xl flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse" />
              <p className="text-sm text-[var(--status-success-text)]">
                <span className="font-bold uppercase tracking-wider">
                  Coupon Applied:
                </span>{" "}
                <span className="font-mono bg-white/50 px-2 py-0.5 rounded border border-[var(--primary)]/10">
                  {order?.coupon_code}
                </span>
              </p>
            </div>
          )}

          <div
            className={
              acceptedCount > 0 && rejectedCount > 0
                ? "grid grid-cols-1 lg:grid-cols-2 gap-8"
                : "grid grid-cols-1 gap-8"
            }
          >
            {/* Left Column: Accepted Items */}
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-gray-800">Accepted Items</h3>
                <span className="text-xs text-gray-400 font-medium">
                  {order?.medicineId?.filter(
                    (m: any) => m.status !== "cancelled"
                  ).length || 0}{" "}
                  Items
                </span>
              </div>
              {order?.medicineId?.filter((m: any) => m.status !== "cancelled")
                .length > 0 ? (
                order?.medicineId
                  .filter((m: any) => m.status !== "cancelled")
                  .map((medicine: any, index: number) => {
                    const status = medicine.status || "pending";
                    let badgeColor =
                      "bg-yellow-50 text-yellow-700 border-yellow-200";
                    let dot = "#facc15";
                    const hasDiscount =
                      medicine?.mrp !== undefined &&
                      medicine?.price !== undefined &&
                      Number(medicine.mrp) > Number(medicine.price);

                    if (status === "delivered") {
                      badgeColor =
                        "bg-green-50 text-green-700 border-green-200";
                      dot = "#22c55e";
                    }

                    return (
                      <div
                        key={index}
                        onClick={() => medidetails(medicine._id)}
                        className="group flex flex-col p-4 border border-gray-100 rounded-xl transition-all duration-200 hover:border-[var(--secondary)]/30 hover:shadow-md hover:bg-gray-50/50 cursor-pointer"
                      >
                        {/* Top Row: Product Info & Status */}
                        <div className="flex justify-between items-start gap-4 mb-4">
                          <div className="flex gap-4">
                            <div className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border border-gray-100 bg-white">
                              {medicine.coverImage ||
                              (medicine.images && medicine.images[0]) ? (
                                <CustomImage
                                  coverImage={
                                    medicine.coverImage || medicine.images[0]
                                  }
                                  images={medicine.images || []}
                                  alt={medicine.name}
                                  style={{
                                    height: "100%",
                                    width: "100%",
                                    objectFit: "cover",
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400 font-bold uppercase">
                                  No Image
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-bold text-gray-900 leading-tight group-hover:text-[var(--primary)]">
                                {medicine.name}
                              </h3>
                              <p className="text-[11px] text-gray-500 font-medium uppercase mt-1">
                                {medicine.manufacturer}
                              </p>
                              <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-[10px] font-bold">
                                Qty: {medicine.quantity || 1}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span
                              className={`px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm ${badgeColor}`}
                            >
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: dot }}
                              />
                              {status}
                            </span>
                          </div>
                        </div>
                        {/* Bottom Row: Pricing */}
                        <div className="flex justify-between items-end pt-3 border-t border-gray-50">
                          <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase">
                              Price Per Unit
                            </p>
                            <div className="flex items-center gap-2">
                              {hasDiscount && (
                                <span className="text-xs text-gray-400 line-through">
                                  ₹{Number(medicine.mrp).toFixed(2)}
                                </span>
                              )}
                              <p className="text-xl font-black text-[var(--primary)] leading-none">
                                ₹{medicine.price?.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
              ) : (
                <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed text-gray-400 text-sm">
                  No accepted items
                </div>
              )}
            </div>

            {/* Right Column: Rejected Items */}
            {rejectedCount > 0 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-gray-800">Rejected Items</h3>
                  <span className="text-xs text-gray-400 font-medium">
                    {order?.medicineId?.filter(
                      (m: any) => m.status === "cancelled"
                    ).length || 0}{" "}
                    Items
                  </span>
                </div>
                {order?.medicineId?.filter((m: any) => m.status === "cancelled")
                  .length > 0 ? (
                  order?.medicineId
                    .filter((m: any) => m.status === "cancelled")
                    .map((medicine: any, index: number) => {
                      const status = "cancelled";
                      const badgeColor =
                        "bg-red-50 text-red-600 border-red-200";
                      const dot = "#f87171";
                      const hasDiscount =
                        medicine?.mrp !== undefined &&
                        medicine?.price !== undefined &&
                        Number(medicine.mrp) > Number(medicine.price);

                      return (
                        <div
                          key={index}
                          onClick={() => medidetails(medicine._id)}
                          className="group flex flex-col p-4 border border-gray-100 rounded-xl transition-all duration-200 hover:border-red-200 hover:shadow-md hover:bg-red-50/30 cursor-pointer"
                        >
                          <div className="flex justify-between items-start gap-4 mb-4">
                            <div className="flex gap-4">
                              <div className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border border-gray-100 bg-white">
                                {medicine.coverImage ||
                                (medicine.images && medicine.images[0]) ? (
                                  <CustomImage
                                    coverImage={
                                      medicine.coverImage || medicine.images[0]
                                    }
                                    images={medicine.images || []}
                                    alt={medicine.name}
                                    style={{
                                      height: "100%",
                                      width: "100%",
                                      objectFit: "cover",
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400 font-bold uppercase">
                                    No Image
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <h3 className="font-bold text-gray-900 leading-tight group-hover:text-red-600">
                                  {medicine.name}
                                </h3>
                                <p className="text-[11px] text-gray-500 font-medium uppercase mt-1">
                                  {medicine.manufacturer}
                                </p>
                                <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-[10px] font-bold">
                                  Qty: {medicine.quantity || 1}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              <span
                                className={`px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm ${badgeColor}`}
                              >
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: dot }}
                                />
                                {status}
                              </span>
                              {medicine.cancelReason && (
                                <span className="text-[10px] text-red-500 italic bg-red-50 px-2 py-0.5 rounded border border-red-100 text-right max-w-[120px]">
                                  {medicine.cancelReason}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex justify-between items-end pt-3 border-t border-gray-50">
                            <div>
                              <p className="text-[10px] text-gray-400 font-bold uppercase">
                                Price Per Unit
                              </p>
                              <div className="flex items-center gap-2">
                                {hasDiscount && (
                                  <span className="text-xs text-gray-400 line-through">
                                    ₹{Number(medicine.mrp).toFixed(2)}
                                  </span>
                                )}
                                <p className="text-xl font-black text-red-600 leading-none">
                                  ₹{medicine.price?.toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed text-gray-400 text-sm">
                    No rejected items
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Order Amount Summary */}
        <div className="bg-[var(--background)] rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold mb-6 text-[var(--foreground)] border-b border-gray-100 pb-3">
            Order Amount Summary
          </h2>

          <div className="space-y-4">
            {/* Line Items */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 font-medium">
                Subtotal
              </span>
              <span className="text-sm font-bold text-gray-900">
                ₹{order?.calculationData?.priceTotalSumBeforeDiscount}
              </span>
            </div>

            {order?.calculationData?.discount >= 1 && (
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 font-medium">
                    Total Discount
                  </span>
                  <span className="text-[10px] px-2 py-0.5 bg-[var(--status-success-bg)] text-[var(--status-success-text)] font-bold rounded-full uppercase tracking-tighter">
                    Savings
                  </span>
                </div>
                <span className="text-sm font-bold text-[var(--primary)]">
                  - ₹{order?.calculationData?.discount}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 font-medium">
                Delivery Charges
              </span>
              <span
                className={`text-sm font-bold ${
                  order?.calculationData?.deliveryFee > 0
                    ? "text-gray-900"
                    : "text-[var(--primary)]"
                }`}
              >
                {order?.calculationData?.deliveryFee !== undefined &&
                order?.calculationData?.deliveryFee > 0
                  ? `₹${order?.calculationData?.deliveryFee?.toFixed(2)}`
                  : "FREE"}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 font-medium">
                Platform Fee
              </span>
              <span className="text-sm font-bold text-gray-900">
                ₹
                {order?.calculationData?.platformFee +
                  order?.calculationData?.razorPayCommissionGstAmount +
                  order?.calculationData?.razorPayCommissionAmount}
              </span>
            </div>

            {/* Divider */}
            <div className="border-t border-dashed border-gray-200 my-2"></div>

            {/* Grand Total */}
            <div className="flex justify-between items-center pt-2">
              <div>
                <p className="text-lg font-black text-gray-900">
                  Final Payable
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-[var(--primary)]">
                  ₹
                  {order?.calculationData?.totalOrderAmount?.toFixed(2) ||
                    "0.00"}
                </span>
              </div>
            </div>

            {/* Payment Status Footer */}
            <div
              className={`mt-4 p-3 rounded-lg text-center text-xs font-bold uppercase tracking-widest border ${
                order?.payment_status === "paid"
                  ? "bg-[var(--status-success-bg)] text-[var(--status-success-text)] border-[var(--primary)]/20"
                  : "bg-[var(--status-pending-bg)] text-[var(--status-pending-text)] border-[var(--status-pending-text)]/10"
              }`}
            >
              {order?.payment_status == "captured"
                ? "✨ Payment Received"
                : "⌛ Awaiting Payment"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
