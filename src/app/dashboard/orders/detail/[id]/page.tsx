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
import { CheckCircle, Clock, Mail, MapPin, Phone, User } from "lucide-react";
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
        {/* --- ORDER SUMMARY CARD --- */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-3">
              <div className="w-5 h-5 text-green-600">
                <svg
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 10h16M4 14h16M4 18h16"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-gray-800 tracking-tight">
                Order Summary
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left & Middle: Core Details */}
              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-5">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                      Order ID
                    </p>
                    <p className="font-bold text-sm text-green-600">
                      {order?.order_id}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                      Payment Mode
                    </p>
                    <div className="flex flex-col">
                      <p className="text-sm font-bold text-gray-800 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        {order?.payment_mode || "Not Selected"}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        ID: {order?.payment_id || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                      Order Status
                    </p>
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter ${getStatusColor(
                        order?.order_status
                      )}`}
                    >
                      {order?.order_status || "Pending"}
                    </span>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                      Ordered On
                    </p>
                    <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      {order?.createdAt
                        ? new Date(order.createdAt).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                      Payment Status
                    </p>
                    <span
                      className={`inline-flex px-3 py-1 rounded text-[10px] font-bold uppercase tracking-tighter ${getStatusColor(
                        order?.payment_status
                      )}`}
                    >
                      {order?.payment_status || "Pending"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Price Calculation Card */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-bold text-gray-700">
                      {" "}
                      ₹{order?.calculationData?.priceTotalSumBeforeDiscount}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Delivery Charges</span>
                    <span className="font-bold text-green-600 uppercase">
                      {" "}
                      {order?.calculationData?.deliveryFee !== undefined &&
                      order?.calculationData?.deliveryFee > 0
                        ? `₹${order?.calculationData?.deliveryFee?.toFixed(2)}`
                        : "FREE"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Platform Fee</span>
                    <span className="font-bold text-gray-700">
                      {" "}
                      ₹
                      {order?.calculationData?.platformFee +
                        order?.calculationData?.razorPayCommissionGstAmount +
                        order?.calculationData?.razorPayCommissionAmount}
                    </span>
                  </div>
                  <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-800">
                      Final Payable
                    </span>
                    <span className="text-2xl font-black text-green-600">
                      {" "}
                      ₹
                      {order?.calculationData?.totalOrderAmount?.toFixed(2) ||
                        "0.00"}
                    </span>
                  </div>
                  <div className="mt-4 bg-yellow-50 text-yellow-700 py-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-2 border border-yellow-100">
                    <svg
                      className="w-3 h-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {order?.payment_status == "captured"
                      ? " Payment Received"
                      : "Awaiting Payment"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- CUSTOMER DETAILS CARD --- */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden p-6">
          <div className="flex items-center gap-2 mb-8 border-b border-gray-100 pb-3">
            <div className="p-1.5 bg-green-50 rounded-lg text-green-600">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-800 tracking-tight">
              Customer Details
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Delivery Section */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4">
                Delivery Address
              </p>
              <div className="flex gap-4">
                <div className="mt-1 p-2 bg-blue-50 text-blue-500 rounded-full h-fit">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-extrabold text-gray-900 text-base">
                      {order?.deliveredAddress?.name}
                    </p>
                    <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded font-bold uppercase border border-gray-200">
                      {order?.deliveredAddress?.addressType || "HOME"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {order?.deliveredAddress?.address?.houseNumber},{" "}
                    {order?.deliveredAddress?.address?.street}, <br />
                    {order?.deliveredAddress?.address?.locality &&
                      `${order.deliveredAddress.address.locality}, `}
                    {order?.deliveredAddress?.address?.city} -{" "}
                    {order?.deliveredAddress?.address?.pinCode} <br />
                    {order?.deliveredAddress?.address?.state}
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Information Section */}
            <div className="space-y-6">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Contact Information
              </p>
              <div className="space-y-4">
                <div>
                  <p className="text-[11px] text-gray-400 mb-1">Email ID</p>
                  <div className="flex items-center gap-2 text-blue-500 font-bold text-sm">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    {order?.userId?.email || "No email provided"}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 mb-1">
                    Mobile Number
                  </p>
                  <div className="flex items-center gap-2 text-blue-500 font-bold text-sm">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    {order?.userId?.mobile
                      ? `+91 ${order.userId.mobile}`
                      : "+91 9873535353"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Items */}
        {/* <div className="bg-[var(--background)] rounded-xl shadow-sm border border-gray-100 p-6">
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
                        className="group flex flex-col p-4 border border-gray-100 rounded-xl transition-all duration-200 hover:border-[var(--secondary)]/30 hover:shadow-md hover:bg-gray-50/50 cursor-pointer"
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
                        <div className="flex justify-between items-end pt-3 border-t border-gray-50">
                          <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase">
                              Price Per Unit
                            </p>
                            <div className="flex items-center gap-2">
                             
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
        </div> */}

        {/* --- ACTIVE / PENDING ITEMS TABLE --- */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-800 tracking-tight">
                Items in Order
              </h2>
              <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-[10px] font-bold border border-gray-200 uppercase">
                {order?.medicineId?.filter((m: any) => m.status !== "cancelled")
                  .length || 0}{" "}
                Items
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Item Details
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">
                    Unit Price
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">
                    Total
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[...(order?.medicineId || [])]
                  .filter((m: any) => m.status !== "cancelled")
                  .sort((a, b) => (a.status === "pending" ? -1 : 1)) // Pending on top
                  .map((medicine: any, index: number) => {
                    const itemTotal =
                      (medicine.price || 0) * (medicine.quantity || 1);
                    return (
                      <tr
                        key={index}
                        className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                      >
                        <td className="px-6 py-5">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900 text-sm uppercase tracking-tight">
                              {medicine.name}
                            </span>
                            <span className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">
                              {medicine.manufacturer}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="px-3 py-1 bg-gray-100 border border-gray-200 rounded text-xs font-bold text-gray-600">
                            Qty: {medicine.quantity || 1}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex flex-col items-end">
                            <span className="text-sm font-bold text-green-600">
                              ₹{Number(medicine.price).toFixed(2)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <span className="text-sm font-black text-gray-900">
                            ₹{itemTotal.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase border tracking-tighter ${
                              medicine.status === "pending"
                                ? "bg-yellow-50 text-yellow-600 border-yellow-200"
                                : "bg-orange-50 text-orange-600 border-orange-200"
                            }`}
                          >
                            {medicine.status === "delivered"
                              ? "ACCEPTED"
                              : medicine.status || "PENDING"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- REJECTED ITEMS TABLE (Same Layout) --- */}
        {order?.medicineId?.some((m: any) => m.status === "cancelled") && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-8">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-red-50/10">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-red-600 tracking-tight">
                  Rejected Items
                </h2>
                <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded-full text-[10px] font-bold border border-red-100 uppercase">
                  {order?.medicineId?.filter(
                    (m: any) => m.status === "cancelled"
                  ).length || 0}{" "}
                  Items
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Item Details
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">
                      Unit Price
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">
                      Total
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {order?.medicineId
                    ?.filter((m: any) => m.status === "cancelled")
                    .map((medicine: any, index: number) => {
                      const itemTotal =
                        (medicine.price || 0) * (medicine.quantity || 1);
                      return (
                        <tr
                          key={index}
                          className="hover:bg-gray-50/50 transition-colors opacity-80"
                        >
                          <td className="px-6 py-5">
                            <div className="flex flex-col">
                              <span className="font-bold text-gray-500 text-sm uppercase line-through">
                                {medicine.name}
                              </span>
                              <span className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">
                                {medicine.manufacturer}
                              </span>
                              {medicine.cancelReason && (
                                <span className="text-[9px] text-red-400 italic mt-1 font-medium">
                                  Reason: {medicine.cancelReason}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <span className="px-3 py-1 bg-gray-50 border border-gray-100 rounded text-xs font-bold text-gray-400">
                              Qty: {medicine.quantity || 1}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-right">
                            <span className="text-sm font-bold text-gray-400">
                              ₹{Number(medicine.price).toFixed(2)}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-right">
                            <span className="text-sm font-black text-gray-400">
                              ₹{itemTotal.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-center">
                            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase border bg-red-50 text-red-600 border-red-200 tracking-tighter">
                              REJECTED
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
