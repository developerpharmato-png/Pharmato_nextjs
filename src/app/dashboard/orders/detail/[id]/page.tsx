"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import HeaderWithAction from "../../../components/HeaderWithAction";
import { CustomImage, ModalHeader } from "../../../components/miniComponents";
import Swal from "sweetalert2";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
} from "@mui/material";
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

  const {
    postData: fetchDetailsPost,
    data: detailsData,
    loading: detailsLoading,
  } = OrderDetailsStore();

  const {
    postData: approvePost,
    data: approveData,
    loading: approveLoading,
    clearData:clearapproveData
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
    try {
      const adminData = localStorage.getItem("admin");
      const admin = adminData ? JSON.parse(adminData) : null;
      await approvePost(PrescriptionApprovePath, {
        orderId: order?._id,
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
      clearapproveData();
      setApprovalNotes("");
      fetchOrderDetail();
    } else {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: (approveData as any).message || "Failed to approve prescription",
      });
      clearapproveData();
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
        orderId: order?._id,
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
    if (!order?.medicineId || order?.medicineId.length === 0) return 0;
    return order?.medicineId.reduce((sum: number, item: any) => {
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
        subtitle={`Order ID: ${order?.order_id}`}
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
              <p className="font-medium text-gray-900">{order?.order_id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Payment ID</p>
              <p className="font-medium text-gray-900 text-xs font-mono">
                {order?.payment_id || "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Order Date & Time</p>
              <p className="font-medium text-gray-900">
                {new Date(order?.createdAt).toLocaleString("en-IN", {
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
                {order?.payment_mode || "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Payment Status</p>
              <span
                className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                  order?.payment_status
                )}`}
              >
                {order?.payment_status || "Pending"}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Order Status</p>
              <span
                className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                  order?.order_status
                )}`}
              >
                {order?.order_status || "Pending"}
              </span>
            </div>
          </div>
        </div>

        {/* Customer Information */}
        {order?.userId && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">
              Customer Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Customer Name</p>
                <p className="font-medium text-gray-900">
                  {order?.userId.name || "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email ID</p>
                <p className="font-medium text-gray-900">
                  {order?.userId.email || "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">
                  Registered Mobile Number
                </p>
                <p className="font-medium text-gray-900">
                  {order?.userId.phone || order?.userId.mobile || "-"}
                </p>
              </div>
              {order?.delivery_address &&
                Object.keys(order?.delivery_address).length > 0 && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500 mb-1">
                      Delivery Address
                    </p>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-900">
                        {Object.values(order?.delivery_address)
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
                  {getPrescriptionStatusBadge(order?.prescription_status)}
                </div>
              </div>
              {order?.isPrescriptionRequired  && (
                <div className="flex gap-2">
                  <button
                    onClick={handleApprovePrescription}
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

          {order?.prescription_url && order.prescription_url.length > 0 && (
  <div className="bg-[var(--background)] rounded-xl border border-gray-100 p-6 shadow-sm mt-6">
    <div className="flex items-center gap-2 mb-4">
      <div className="p-2 bg-[var(--status-purple-bg)] rounded-lg">
        <svg className="w-5 h-5 text-[var(--status-purple-text)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h3 className="font-bold text-gray-900">Medical Prescriptions</h3>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {order.prescription_url.map((url: string, idx: number) => {
        const isPdf = url.toLowerCase().endsWith(".pdf");

        return (
          <div key={idx} className="group relative border border-gray-100 rounded-xl overflow-hidden bg-gray-50 hover:border-[var(--secondary)] transition-all">
            {isPdf ? (
              /* PDF UI */
              <div className="flex flex-col items-center justify-center p-8 h-48">
                <div className="text-[var(--status-danger-text)] mb-3">
                   <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 012-2h4.586A1 1 0 0111.293 2.707l3 3a1 1 0 01.293.707V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" /></svg>
                </div>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-[var(--primary)] hover:text-white transition-colors shadow-sm"
                >
                  View Prescription PDF
                </a>
              </div>
            ) : (
              /* Image UI */
              <div className="relative h-48 w-full group">
                <img
                  src={url}
                  alt={`Prescription ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-white rounded-full text-gray-900 shadow-xl scale-90 group-hover:scale-100 transition-transform"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </a>
                </div>
              </div>
            )}
            <div className="p-3 bg-white border-t border-gray-100 flex justify-between items-center">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Document {idx + 1}</span>
                </div>
          </div>
        );
      })}
    </div>
  </div>
)}
            {order?.prescription_rejection_reason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-red-900 mb-1">
                  Rejection Reason:
                </p>
                <p className="text-red-800">
                  {order?.prescription_rejection_reason}
                </p>
              </div>
            )}

            {order?.prescription_approval_notes && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-green-900 mb-1">
                  Approval Notes:
                </p>
                <p className="text-green-800">
                  {order?.prescription_approval_notes}
                </p>
              </div>
            )}

        
          </div>
        </div>

  {/* Order Items */}
<div className="bg-[var(--background)] rounded-xl shadow-sm border border-gray-100 p-6">
  <h2 className="text-xl font-bold mb-5 text-[var(--foreground)] border-b border-gray-100 pb-3 flex justify-between items-center">
    Items in Order 
    <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
      {order?.medicineId?.length || 0} {order?.medicineId?.length === 1 ? 'item' : 'items'}
    </span>
  </h2>

  {order?.coupon_code && (
    <div className="mb-6 p-4 bg-[var(--status-success-bg)] border border-[var(--secondary)]/20 rounded-xl flex items-center gap-2">
      <div className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse" />
      <p className="text-sm text-[var(--status-success-text)]">
        <span className="font-bold uppercase tracking-wider">Coupon Applied:</span>{" "}
        <span className="font-mono bg-white/50 px-2 py-0.5 rounded border border-[var(--primary)]/10">
          {order?.coupon_code}
        </span>
      </p>
    </div>
  )}

  <div className="space-y-4">
    {order?.medicineId && order?.medicineId.length > 0 ? (
      order?.medicineId.map((medicine: any, index: number) => (
        <div
          key={index}
          className="group flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border border-gray-100 rounded-xl transition-all duration-200 hover:border-[var(--secondary)]/30 hover:shadow-md hover:bg-gray-50/50"
        >
          {/* Image Container */}
          <div className="shrink-0 mx-auto sm:mx-0">
            {medicine.coverImage || (medicine.images && medicine.images[0]) ? (
              <div className="ring-1 ring-gray-100 rounded-lg overflow-hidden group-hover:ring-[var(--secondary)]/30 transition-all">
                <CustomImage
                  coverImage={medicine.coverImage || medicine.images[0]}
                  images={medicine.images || []}
                  alt={medicine.name}
                  style={{
                    height: 80,
                    width: 80,
                    objectFit: "cover",
                  }}
                />
              </div>
            ) : (
              <div className="w-20 h-20 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center">
                <span className="text-gray-400 text-[10px] font-medium uppercase">No Image</span>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex-1 space-y-1 text-center sm:text-left">
            <h3 className="font-bold text-gray-900 group-hover:text-[var(--primary)] transition-colors">
              {medicine.name}
            </h3>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-tight">
              {medicine.manufacturer || "Unknown Manufacturer"}
            </p>
            <div className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-[var(--status-info-bg)] text-[var(--status-info-text)] mt-2">
              Qty: {medicine.quantity || 1}
            </div>
          </div>

          {/* Pricing Section */}
          <div className="w-full sm:w-auto text-center sm:text-right pt-4 sm:pt-0 border-t sm:border-t-0 border-gray-100">
            <div className="flex flex-row sm:flex-col justify-between items-center sm:items-end gap-1">
               <div>
                  <p className="text-[10px] text-gray-400 uppercase font-bold">Price per unit</p>
                  <div className="flex items-center gap-2 sm:justify-end">
                    <span className="text-sm text-gray-400 line-through">₹{medicine.mrp?.toFixed(2)}</span>
                    <span className="font-bold text-[var(--foreground)]">₹{medicine.price?.toFixed(2)}</span>
                  </div>
               </div>
               
               <div className="sm:mt-3">
                  <p className="text-[10px] text-[var(--primary)] uppercase font-bold">Subtotal</p>
                  <p className="text-lg font-black text-[var(--primary)]">
                    ₹{calculateItemSubtotal(medicine).toFixed(2)}
                  </p>
                  {medicine.discount > 0 && (
                    <span className="inline-block px-2 py-0.5 bg-[var(--status-success-bg)] text-[var(--status-success-text)] text-[10px] font-bold rounded uppercase">
                      {medicine.discount}% Saved
                    </span>
                  )}
               </div>
            </div>
          </div>
        </div>
      ))
    ) : (
      <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
        <p className="text-gray-400 font-medium">No items found in this order</p>
      </div>
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
                ₹{order?.actual_amount?.toFixed(2) || "0.00"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Delivery Charges</span>
              <span className="font-medium">
                {order?.delivery_charges !== undefined &&
                order?.delivery_charges > 0
                  ? `₹${order?.delivery_charges?.toFixed(2)}`
                  : "FREE"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Platform Fee</span>
              <span className="font-medium">
                ₹{order?.platform_fee?.toFixed(2) || "0.00"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Taxes (GST)</span>
              <span className="font-medium">
                ₹{order?.user_total_tax_charged?.toFixed(2) || "0.00"}
              </span>
            </div>
            <div className="border-t pt-3 flex justify-between text-lg font-semibold">
              <span>Final Payable Amount</span>
              <span className="text-green-600">
                ₹{order?.total_order_amount?.toFixed(2) || "0.00"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Reject Prescription Modal (MUI) */}
      <Dialog
        open={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setRejectionReason("");
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            overflow: "visible",
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle sx={{ p: 2 }}>
          <ModalHeader
            title="Reject Prescription"
            onClose={() => {
              setShowRejectModal(false);
              setRejectionReason("");
            }}
          />
        </DialogTitle>
        <DialogContent sx={{ overflow: "visible" }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Please provide a reason for rejecting this prescription. The
            customer will be notified and can re-upload a new prescription.
          </Typography>
          <TextField
            multiline
            minRows={4}
            fullWidth
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Enter rejection reason..."
            variant="outlined"
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowRejectModal(false);
              setRejectionReason("");
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleRejectPrescription}
            variant="contained"
            color="error"
          >
            Reject
          </Button> 
        </DialogActions> 
      </Dialog> 
    </div>
  );
}
