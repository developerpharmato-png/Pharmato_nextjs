"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import HeaderWithAction from "../../../components/HeaderWithAction";
import { CustomImage } from "../../../components/miniComponents";
import Swal from "sweetalert2";
import {
  OrderDetailsStore,
  ApprovePrescriptionStore,
  RejectPrescriptionStore,
} from "../../../storeAPICall/useUserStore";
import {
  OrderDetailPath,
  PrescriptionApprovePath,
  PrescriptionRejectPath,
} from "../../../storeAPICall/API/BaseApi";

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [showApproveModal, setShowApproveModal] = useState(false);

  const {
    postData: fetchDetailsPost,
    data: detailsData,
    loading: detailsLoading,
  } = OrderDetailsStore();

  const {
    postData: approvePost,
    data: approveData,
    loading: approveLoading,
  } = ApprovePrescriptionStore();

  const {
    postData: rejectPost,
    data: rejectData,
    loading: rejectLoading,
  } = RejectPrescriptionStore();

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

  const handleApprovePrescription = async () => {
    setShowApproveModal(false);
    try {
      const adminData = localStorage.getItem("admin");
      const admin = adminData ? JSON.parse(adminData) : null;
      await approvePost(PrescriptionApprovePath, {
        orderId: order._id,
        adminId: admin?._id,
        approvalNotes: approvalNotes.trim() || undefined,
      });
    } catch (error) {
      // handled in approveData effect
    }
  };

  useEffect(() => {
    if (!approveData) return;
    const success = (approveData as any).success;
    if (success) {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Prescription approved successfully",
        showConfirmButton: false,
        timer: 2000,
      });
      setApprovalNotes("");
      fetchOrderDetail();
    } else {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: (approveData as any).message || "Failed to approve prescription",
      });
    }
  }, [approveData]);

  const handleRejectPrescription = async () => {
    if (!rejectionReason.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Rejection Reason Required",
        text: "Please provide a reason for rejection",
      });
      return;
    }
    try {
      const adminData = localStorage.getItem("admin");
      const admin = adminData ? JSON.parse(adminData) : null;
      await rejectPost(PrescriptionRejectPath, {
        orderId: order._id,
        adminId: admin?._id,
        rejectionReason,
      });
    } catch (error) {
      // handled in rejectData effect
    }
  };

  useEffect(() => {
    if (!rejectData) return;
    const success = (rejectData as any).success;
    if (success) {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Prescription rejected successfully",
        showConfirmButton: false,
        timer: 2000,
      });
      setShowRejectModal(false);
      setRejectionReason("");
      fetchOrderDetail();
    } else {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: (rejectData as any).message || "Failed to reject prescription",
      });
    }
  }, [rejectData]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
      case "placed":
        return "status-pending";
      case "completed":
      case "success":
      case "delivered":
      case "approved":
        return "status-success";
      case "failed":
      case "cancelled":
      case "rejected":
        return "status-danger";
      case "processing":
      case "confirmed":
      case "packed":
        return "status-info";
      case "dispatched":
        return "status-purple";
      case "prescription re-upload required":
      case "re-upload required":
        return "status-warning";
      default:
        return "status-default";
    }
  };

  const getPrescriptionStatusBadge = (status: string) => {
    const statusLower = status?.toLowerCase();
    if (statusLower === "approved") {
      return (
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          Approved
        </span>
      );
    } else if (statusLower === "rejected") {
      return (
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
          Rejected
        </span>
      );
    } else if (statusLower === "re-upload required") {
      return (
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
          Re-upload Required
        </span>
      );
    } else {
      return (
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
          Pending
        </span>
      );
    }
  };

  const calculateItemSubtotal = (medicine: any) => {
    const quantity = medicine.quantity || 1;
    const price = medicine.price || 0;
    return quantity * price;
  };

  const calculateTotalMRP = () => {
    if (!order?.medicineId || order.medicineId.length === 0) return 0;
    return order.medicineId.reduce((sum: number, item: any) => {
      return sum + (item.mrp || 0) * (item.quantity || 1);
    }, 0);
  };

  const calculateTotalDiscount = () => {
    const totalMRP = calculateTotalMRP();
    const actualAmount = order?.actual_amount || 0;
    return totalMRP - actualAmount;
  };

  if (loading) {
    return (
      <div className="containerStyle">
        <HeaderWithAction
          title="Order Details"
          subtitle="Loading order information..."
          showBack={true}
          onBack={() => router.push("/dashboard/orders")}
          showSearch={false}
          addShow={false}
        />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="containerStyle scrollbar-hide">
      <HeaderWithAction
        title="Order Details"
        subtitle={`Order ID: ${order.order_id}`}
        showBack={true}
        onBack={() => router.push("/dashboard/orders")}
        showSearch={false}
        addShow={false}
         isunsaved={false}
      />

      <div className="space-y-6">
        {/* Order Summary Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">
            Order Summary
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Order ID</p>
              <p className="font-medium text-gray-900">{order.order_id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Payment ID</p>
              <p className="font-medium text-gray-900 text-xs font-mono">
                {order.payment_id || "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Order Date & Time</p>
              <p className="font-medium text-gray-900">
                {new Date(order.createdAt).toLocaleString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Payment Mode</p>
              <p className="font-medium text-gray-900 capitalize">
                {order.payment_mode || "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Payment Status</p>
              <span
                className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                  order.payment_status
                )}`}
              >
                {order.payment_status || "Pending"}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Order Status</p>
              <span
                className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                  order.order_status
                )}`}
              >
                {order.order_status || "Pending"}
              </span>
            </div>
          </div>
        </div>

        {/* Customer Information */}
        {order.userId && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">
              Customer Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Customer Name</p>
                <p className="font-medium text-gray-900">
                  {order.userId.name || "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email ID</p>
                <p className="font-medium text-gray-900">
                  {order.userId.email || "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">
                  Registered Mobile Number
                </p>
                <p className="font-medium text-gray-900">
                  {order.userId.phone || order.userId.mobile || "-"}
                </p>
              </div>
              {order.delivery_address &&
                Object.keys(order.delivery_address).length > 0 && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500 mb-1">
                      Delivery Address
                    </p>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-900">
                        {Object.values(order.delivery_address)
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </div>
                  </div>
                )}
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">
            Prescription Management
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Prescription Status</p>
                <div className="mt-1">
                  {getPrescriptionStatusBadge(order.prescription_status)}
                </div>
              </div>
              {order.prescription_status === "Pending" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowApproveModal(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>

            {order.prescription_url && (
              <div>
                <p className="text-sm text-gray-500 mb-2">
                  Uploaded Prescription
                </p>
                <div className="border rounded-lg p-4">
                  {order.prescription_url.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                    <img
                      src={order.prescription_url}
                      alt="Prescription"
                      className="max-w-full h-auto max-h-96 object-contain"
                    />
                  ) : (
                    <a
                      href={order.prescription_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-2"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                      View Prescription (PDF)
                    </a>
                  )}
                </div>
              </div>
            )}

            {order.prescription_rejection_reason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-red-900 mb-1">
                  Rejection Reason:
                </p>
                <p className="text-red-800">
                  {order.prescription_rejection_reason}
                </p>
              </div>
            )}

            {order.prescription_approval_notes && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-green-900 mb-1">
                  Approval Notes:
                </p>
                <p className="text-green-800">
                  {order.prescription_approval_notes}
                </p>
              </div>
            )}

            {order.prescription_approved_at && (
              <div className="text-sm text-gray-600">
                <p>
                  Approved on:{" "}
                  {new Date(order.prescription_approved_at).toLocaleString(
                    "en-IN"
                  )}
                </p>
              </div>
            )}

            {order.prescription_rejected_at && (
              <div className="text-sm text-gray-600">
                <p>
                  Rejected on:{" "}
                  {new Date(order.prescription_rejected_at).toLocaleString(
                    "en-IN"
                  )}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">
            Items in Order ({order.medicineId?.length || 0} items)
          </h2>
          {order.coupon_code && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                <span className="font-semibold">Coupon Applied:</span>{" "}
                {order.coupon_code}
              </p>
            </div>
          )}
          <div className="space-y-4">
            {order.medicineId && order.medicineId.length > 0 ? (
              order.medicineId.map((medicine: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-shrink-0">
                    {medicine.coverImage ||
                    (medicine.images && medicine.images[0]) ? (
                      <CustomImage
                        coverImage={medicine.coverImage || medicine.images[0]}
                        images={medicine.images || []}
                        alt={medicine.name}
                        style={{
                          height: 64,
                          width: 64,
                          objectFit: "cover",
                          borderRadius: 8,
                        }}
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-gray-400 text-xs">No Image</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">
                      {medicine.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {medicine.manufacturer || "-"}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Quantity:{" "}
                      <span className="font-medium">
                        {medicine.quantity || 1}
                      </span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">MRP</p>
                    <p className="text-sm text-gray-500 line-through">
                      ₹{medicine.mrp?.toFixed(2) || "0.00"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Selling Price</p>
                    <p className="font-medium text-gray-900">
                      ₹{medicine.price?.toFixed(2) || "0.00"}
                    </p>
                    {medicine.discount > 0 && (
                      <p className="text-xs text-green-600 mt-1">
                        {medicine.discount}% off
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">Subtotal</p>
                    <p className="font-semibold text-gray-900">
                      ₹{calculateItemSubtotal(medicine).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No items found</p>
            )}
          </div>
        </div>

        {/* Order Amount Summary */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">
            Order Amount Summary
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total MRP</span>
              <span className="font-medium">
                ₹{calculateTotalMRP().toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-green-600">
              <span>Total Discount</span>
              <span className="font-medium">
                -₹{calculateTotalDiscount().toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal (After Discount)</span>
              <span className="font-medium">
                ₹{order.actual_amount?.toFixed(2) || "0.00"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Delivery Charges</span>
              <span className="font-medium">
                {order.delivery_charges !== undefined &&
                order.delivery_charges > 0
                  ? `₹${order.delivery_charges?.toFixed(2)}`
                  : "FREE"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Platform Fee</span>
              <span className="font-medium">
                ₹{order.platform_fee?.toFixed(2) || "0.00"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Taxes (GST)</span>
              <span className="font-medium">
                ₹{order.user_total_tax_charged?.toFixed(2) || "0.00"}
              </span>
            </div>
            <div className="border-t pt-3 flex justify-between text-lg font-semibold">
              <span>Final Payable Amount</span>
              <span className="text-green-600">
                ₹{order.total_order_amount?.toFixed(2) || "0.00"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Approve Prescription Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Approve Prescription
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              You are about to approve this prescription. You can optionally add
              notes for your records.
            </p>
            <textarea
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              placeholder="Add approval notes (optional)..."
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none resize-none"
              rows={4}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setShowApproveModal(false);
                  setApprovalNotes("");
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleApprovePrescription}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Prescription Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Reject Prescription
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for rejecting this prescription. The
              customer will be notified and can re-upload a new prescription.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
              rows={4}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason("");
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectPrescription}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
