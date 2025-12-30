"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Swal from "sweetalert2";
import HeaderWithAction from "../../../../components/HeaderWithAction";
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Typography,
  Chip,
} from "@mui/material";
import {
  ModalHeader,
  CustomImage,
  CustomButton,
} from "@/app/dashboard/components/miniComponents";
import { modalStyles } from "@/utils/style";
import { Box, Stack } from "@mui/system";
import { downloadImageByUrl } from "@/utils/function";
import PartialCancel from "@/app/dashboard/components/skeleton/PartialCancel";

export default function PartialCancelPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params?.id as string;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [cancelReason, setCancelReason] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  // Prescription management states
  const [showRejectModalPresc, setShowRejectModalPresc] = useState(false);
  const [rejectionReasonPresc, setRejectionReasonPresc] = useState("");
  const [approvalNotesPresc, setApprovalNotesPresc] = useState("");
  const [approveLoading, setApproveLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);
  // Order status update dialog
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [statusToUpdate, setStatusToUpdate] = useState("");
  const [showCancelReasonDialog, setShowCancelReasonDialog] = useState(false);
  const [previewSelectedMeds, setPreviewSelectedMeds] = useState<any[]>([]);
  const [previewUnselectedMeds, setPreviewUnselectedMeds] = useState<any[]>([]);
  const statusOptions = [
    { value: "Delivered", label: "Delivered" },
  ];

  const medidetails = (_id: String) => {
    router.push(`/dashboard/medicines/${_id}`);
  };

  useEffect(() => {
    if (orderId) fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/order/detail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (data.success) {
        setOrder(data.data);
        // Auto-select all pending medicines
        const pendingIds = (data.data?.medicineQuantity || [])
          .filter((q: any) => q?.status === "pending")
          .map((q: any) =>
            q.medicineId?.toString ? q.medicineId.toString() : q.medicineId
          );
        setSelected(pendingIds);
      } else {
        Swal.fire("Error", data.message || "Order not found", "error");
        router.push("/dashboard/orders");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePrescription = async () => {
    if (!order) return;
    setApproveLoading(true);
    try {
      const adminData = localStorage.getItem("admin");
      const admin = adminData ? JSON.parse(adminData) : null;
      const res = await fetch("/api/admin/order/prescription/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          adminId: admin?._id,
          approvalNotes: approvalNotesPresc || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: "Prescription approved successfully",
          showConfirmButton: false,
          timer: 2000,
        });
        setApprovalNotesPresc("");
        fetchOrder();
      } else {
        Swal.fire(
          "Error",
          data.message || "Failed to approve prescription",
          "error"
        );
      }
    } catch (e) {
      Swal.fire("Error", "Failed to approve prescription", "error");
    } finally {
      setApproveLoading(false);
    }
  };

  const handleRejectPrescription = async () => {
    if (!rejectionReasonPresc.trim()) {
      Swal.fire("Warning", "Provide rejection reason", "warning");
      return;
    }
    setRejectLoading(true);
    try {
      const adminData = localStorage.getItem("admin");
      const admin = adminData ? JSON.parse(adminData) : null;
      const res = await fetch("/api/admin/order/prescription/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          adminId: admin?._id,
          rejectionReason: rejectionReasonPresc,
        }),
      });
      const data = await res.json();
      if (data.success) {
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: "Prescription rejected",
          showConfirmButton: false,
          timer: 2000,
        });
        setRejectionReasonPresc("");
        setShowRejectModalPresc(false);
        fetchOrder();
      } else {
        Swal.fire(
          "Error",
          data.message || "Failed to reject prescription",
          "error"
        );
      }
    } catch (e) {
      Swal.fire("Error", "Failed to reject prescription", "error");
    } finally {
      setRejectLoading(false);
    }
  };

  const handleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleCancel = async () => {
    // Allow API call even if selected is empty
    setShowDialog(false);
    try {
      const res = await fetch("/api/admin/order/partial-cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, medicineIds: selected, cancelReason }),
      });
      const data = await res.json();
      if (data.success) {
        Swal.fire("Success", "Selected medicines cancelled", "success");
        setSelected([]);
        setCancelReason("");
        fetchOrder();
      } else {
        Swal.fire("Error", data.message || "Failed to cancel", "error");
      }
    } catch (e) {
      Swal.fire("Error", "Failed to cancel", "error");
    }
  };

  if (loading)
    return (
      <div className="scrollbar-hide containerStyle">
        <PartialCancel />
      </div>
    );
  if (!order) return null;

  // Check if at least one medicine has status 'pending'
  const hasPending = order?.medicineQuantity?.some(
    (q: any) => q?.status === "pending"
  );
  // collect ids of medicines that are pending
  const pendingMedicineIds: string[] = (order?.medicineQuantity || [])
    .filter((q: any) => q?.status === "pending")
    .map((q: any) =>
      q.medicineId?.toString ? q.medicineId.toString() : q.medicineId
    );

  console.log("$$$$$$$pendingMedicineIds$$$$$$$$", pendingMedicineIds);

  return (
    <div className="containerStyle scrollbar-hide">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <HeaderWithAction
          title="Manage Order"
          showBack={true}
          onBack={() => router.push(`/dashboard/orders/detail/${orderId}`)}
          showSearch={false}
          addShow={false}
        />
        <CustomButton width="250px" onClick={() => setShowStatusDialog(true)}>
          Update Order
        </CustomButton>
      </div>
      {/* Order ID and Status block below header */}
      <div style={{ marginBottom: 16, marginTop: -4 }}>
        <div style={{ fontSize: 15, fontWeight: 500 }}>
          Order ID: {order.order_id}
        </div>
        {/* Modern status badge */}
        <div style={{ marginTop: 8 }}>
          <span
            style={{
              display: "inline-block",
              padding: "6px 18px",
              borderRadius: 20,
              fontWeight: 600,
              fontSize: 15,
              letterSpacing: 0.2,
              background:
                order.order_status === "Delivered"
                  ? "#e8f5e9"
                  : order.order_status === "Out For Delivery"
                  ? "#e3f2fd"
                  : order.order_status === "Cancelled"
                  ? "#ffebee"
                  : "#f3f4f6",
              color:
                order.order_status === "Delivered"
                  ? "#388e3c"
                  : order.order_status === "Out For Delivery"
                  ? "#1565c0"
                  : order.order_status === "Cancelled"
                  ? "#d32f2f"
                  : "#555",
              border:
                order.order_status === "Delivered"
                  ? "1px solid #a5d6a7"
                  : order.order_status === "Out For Delivery"
                  ? "1px solid #90caf9"
                  : order.order_status === "Cancelled"
                  ? "1px solid #ef9a9a"
                  : "1px solid #e0e0e0",
              boxShadow: "0 1px 4px #0001",
              textTransform: "capitalize",
            }}
          >
            {order.order_status
              ? order.order_status
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (c: string) => c.toUpperCase())
              : "Status Unknown"}
          </span>
        </div>
      </div>

      <Dialog
        open={showStatusDialog}
        onClose={() => setShowStatusDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Update Order Status</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel id="order-status-label">Select Status</InputLabel>
            <Select
              labelId="order-status-label"
              value={statusToUpdate}
              label="Select Status"
              onChange={(e) => setStatusToUpdate(e.target.value)}
            >
              {statusOptions.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowStatusDialog(false)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            disabled={!statusToUpdate}
            onClick={async () => {
              const res = await fetch("/api/admin/order/update-status", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId, status: statusToUpdate }),
              });
              const data = await res.json();
              if (data.success) {
                Swal.fire("Success", "Order status updated", "success");
                setShowStatusDialog(false);
                setStatusToUpdate("");
                fetchOrder();
              } else {
                Swal.fire(
                  "Error",
                  data.message || "Failed to update status",
                  "error"
                );
              }
            }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Prescription Management (similar to Order Details) */}
      <div className="bg-[var(--background)] rounded-xl shadow-sm border border-gray-100 p-6 mt-6">
        <h2 className="text-xl font-bold mb-6 text-[var(--foreground)] border-b border-gray-100 pb-3">
          Prescription Management
        </h2>

        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Current Status
              </p>
              <div className="mt-1">
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                  {order?.prescription_status || "Pending"}
                </span>
              </div>
            </div>

            {order?.isPrescriptionRequired &&
              order?.prescription_status?.toLowerCase() == "pending" && (
                <div className="flex gap-3 w-full sm:w-auto">
                  <button
                    onClick={handleApprovePrescription}
                    disabled={approveLoading}
                    className="flex-1 sm:flex-none px-6 py-2.5 bg-[var(--primary)] text-white text-sm font-bold rounded-lg hover:opacity-90 transition-all shadow-sm"
                  >
                    {approveLoading ? "Approving..." : "Approve"}
                  </button>
                  <button
                    onClick={() => setShowRejectModalPresc(true)}
                    disabled={rejectLoading}
                    className="flex-1 sm:flex-none px-6 py-2.5 bg-white border-2 border-[var(--status-danger-text)] text-[var(--status-danger-text)] text-sm font-bold rounded-lg hover:bg-[var(--status-danger-bg)] transition-all"
                  >
                    {rejectLoading ? "Rejecting..." : "Reject"}
                  </button>
                </div>
              )}
          </div>

          {/* Prescription documents grid */}
          {order?.prescription_url && order.prescription_url.length > 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {order.prescription_url.map((url: string, idx: number) => {
                  const isPdf = url.toLowerCase().endsWith(".pdf");
                  return (
                    <div
                      key={idx}
                      className="group relative border border-gray-200 rounded-xl overflow-hidden bg-white hover:border-[var(--secondary)] transition-all shadow-sm"
                    >
                      {isPdf ? (
                        <div className="relative flex flex-col items-center justify-center p-6 h-40 bg-gray-50">
                          {/* PDF Download Button - Always Visible */}
                          <div className="absolute top-2 right-2 flex gap-2">
                            <button
                              onClick={() => downloadImageByUrl(url)}
                              className="bg-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold shadow-md flex items-center gap-1.5 text-gray-700 border border-gray-100 hover:bg-gray-50 transition-all"
                              title="Download PDF"
                            >
                              <svg
                                className="w-3.5 h-3.5 text-[var(--status-danger-text)]"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2.5}
                                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                />
                              </svg>
                              DOWNLOAD
                            </button>
                          </div>

                          {/* PDF Icon and View Link */}
                          <svg
                            className="w-10 h-10 text-[var(--status-danger-text)] mb-2"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M4 4a2 2 0 012-2h4.586A1 1 0 0111.293 2.707l3 3a1 1 0 01.293.707V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                          </svg>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-bold text-[var(--primary)] hover:underline"
                          >
                            VIEW PDF
                          </a>
                        </div>
                      ) : (
                        <div className="relative h-40 w-full">
                          <CustomImage
                            coverImage={url}
                            images={[url]}
                            alt={`Prescription ${idx + 1}`}
                            style={{
                              height: "100%",
                              width: "100%",
                              objectFit: "cover",
                            }}
                          />
                          <div className="absolute top-2 right-2 flex gap-2">
                            <button
                              onClick={() => downloadImageByUrl(url)}
                              className="bg-white/95 px-2.5 py-1.5 rounded-lg text-[10px] font-bold shadow-lg flex items-center gap-1.5 text-gray-700 border border-gray-100 hover:bg-white transition-all"
                            >
                              <svg
                                className="w-3.5 h-3.5 text-[var(--primary)]"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2.5}
                                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                />
                              </svg>
                              DOWNLOAD
                            </button>
                          </div>
                        </div>
                      )}
                      <div className="p-2.5 bg-white border-t border-gray-100 text-center">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">
                          Page {idx + 1}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reject prescription dialog */}
      <Dialog
        open={showRejectModalPresc}
        onClose={() => setShowRejectModalPresc(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: modalStyles.paper }}
      >
        <DialogTitle>
          <ModalHeader
            title="Reject Prescription"
            onClose={() => setShowRejectModalPresc(false)}
          />
        </DialogTitle>
        <DialogContent sx={modalStyles.content}>
          <Box sx={modalStyles.noticeBox}>
            <p className="text-xs font-semibold text-[var(--status-danger-text)] leading-relaxed">
              <span className="font-bold">⚠️ Notice:</span> Please provide a
              clear reason for rejection. This message will be sent to the
              customer.
            </p>
          </Box>
          <TextField
            multiline
            minRows={4}
            fullWidth
            autoFocus
            value={rejectionReasonPresc}
            onChange={(e) => setRejectionReasonPresc(e.target.value)}
            placeholder="e.g., Signature not visible"
            variant="outlined"
            margin="normal"
            sx={modalStyles.textField}
          />
        </DialogContent>
        <DialogActions sx={modalStyles.actions}>
          <Button
            onClick={() => setShowRejectModalPresc(false)}
            sx={modalStyles.cancelBtn}
          >
            Cancel
          </Button>
          <Button
            onClick={handleRejectPrescription}
            variant="contained"
            disabled={!rejectionReasonPresc.trim() || rejectLoading}
            sx={modalStyles.confirmBtn}
          >
            {rejectLoading ? "Rejecting..." : "Reject Document"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* --- End Prescription Management --- */}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-6">
        <h2 className="text-xl font-bold mb-4">Ordered Items</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setShowDialog(true);
          }}
        >
          <div className="space-y-3 mb-6">
            {/* Select all pending checkbox */}
            <div className="flex items-center gap-2 mb-2">
              <Checkbox
                checked={
                  pendingMedicineIds.length > 0 &&
                  pendingMedicineIds.every((id) => selected.includes(id))
                }
                indeterminate={
                  pendingMedicineIds.length > 0 &&
                  pendingMedicineIds.some((id) => selected.includes(id)) &&
                  !pendingMedicineIds.every((id) => selected.includes(id))
                }
                onChange={(e) => {
                  if (e.target.checked) {
                    // add all pending ids to selected
                    setSelected((prev) =>
                      Array.from(new Set([...prev, ...pendingMedicineIds]))
                    );
                  } else {
                    // remove all pending ids from selected
                    setSelected((prev) =>
                      prev.filter((id) => !pendingMedicineIds.includes(id))
                    );
                  }
                }}
                disabled={pendingMedicineIds.length === 0}
              />
              <div className="text-sm font-medium">
                Select All Pending Items
              </div>
            </div>
            {/* {order.medicineId && order.medicineId.length > 0 ? (
              order.medicineId.map((med: any, idx: number) => {
                // Find status from medicineQuantity
                const q = order.medicineQuantity.find(
                  (x: any) =>
                    x.medicineId === med._id ||
                    x.medicineId?.toString() === med._id?.toString()
                );
                const status = q?.status || "pending";
                return (
                  <div
                    key={med._id}
                    className="flex items-center gap-4 p-3 border rounded-lg"
                  >
                    <Checkbox
                      checked={selected.includes(med._id)}
                      onChange={() => handleSelect(med._id)}
                      disabled={status !== "pending"}
                    />
                    <div className="flex-1">
                      <div className="font-bold">{med.name}</div>
                      <div className="text-xs text-gray-500">
                        Qty: {q?.quantity || 1}
                      </div> 
                      <div
                        className={`text-xs font-semibold ${status === "cancelled"
                          ? "text-red-500"
                          : status === "accepted"
                            ? "text-green-600"
                            : "text-yellow-600"
                          }`}
                      >
                        Status:{" "}
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </div>
                      {status === "cancelled" && q?.cancelReason && (
                        <div className="text-xs text-red-400 mt-1 italic">
                          Reason: {q.cancelReason}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div>No medicines found in this order.</div>
            )} */}

            <div className="mt-8">
              <div className="flex justify-between items-center mb-6">
                <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-bold">
                  {order?.medicineId?.length || 0} Items
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {order.medicineId && order.medicineId.length > 0 ? (
                  order.medicineId.map((med: any, idx: number) => {
                    // Finding quantity and status logic from your first snippet
                    const q = order.medicineQuantity?.find(
                      (x: any) =>
                        x.medicineId === med._id ||
                        x.medicineId?.toString() === med._id?.toString()
                    );
                    const status = q?.status || med.status || "pending";

                    // Dynamic badge colors
                    let badgeColor =
                      "bg-yellow-50 text-yellow-700 border-yellow-200";
                    let dot = "#facc15";
                    if (status === "accepted" || status === "delivered") {
                      badgeColor =
                        "bg-green-50 text-green-700 border-green-200";
                      dot = "#22c55e";
                    } else if (
                      status === "cancelled" ||
                      status === "rejected"
                    ) {
                      badgeColor = "bg-red-50 text-red-600 border-red-200";
                      dot = "#f87171";
                    }

                    return (
                      <div
                        key={med._id}
                        className="group relative flex items-start gap-4 p-4 border border-gray-100 rounded-xl transition-all duration-200 hover:shadow-md hover:bg-gray-50/50 bg-white"
                      >
                        {/* Checkbox - Logic preserved exactly as requested */}
                        <div className="mt-1">
                          <Checkbox
                            checked={selected.includes(med._id)}
                            onChange={() => handleSelect(med._id)}
                            disabled={status !== "pending"}
                          />
                        </div>

                        <div
                          className="flex-1 cursor-pointer"
                          onClick={() => medidetails(med._id)}
                        >
                          {/* Top Row: Image and Info */}
                          <div className="flex gap-4">
                            <div className="shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-gray-100 bg-white">
                              {med.coverImage ||
                              (med.images && med.images[0]) ? (
                                <CustomImage
                                  coverImage={med.coverImage || med.images[0]}
                                  images={med.images || []}
                                  alt={med.name}
                                  style={{
                                    height: "100%",
                                    width: "100%",
                                    objectFit: "cover",
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-400 font-bold uppercase">
                                  No Image
                                </div>
                              )}
                            </div>

                            <div className="flex-1">
                              <h3 className="font-bold text-gray-900 leading-tight group-hover:text-[var(--primary)] line-clamp-1">
                                {med.name}
                              </h3>
                              <p className="text-[10px] text-gray-500 font-medium uppercase mt-0.5 line-clamp-1">
                                {med.manufacturer}
                              </p>
                              <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-[10px] font-bold">
                                Qty: {q?.quantity || med.quantity || 1}
                              </div>
                            </div>

                            {/* Status Badge */}
                            <div className="shrink-0">
                              <span
                                className={`px-2 py-1 rounded-full border text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm ${badgeColor}`}
                              >
                                <div
                                  className="w-1.5 h-1.5 rounded-full"
                                  style={{ backgroundColor: dot }}
                                />
                                {status}
                              </span>
                            </div>
                          </div>

                          {/* Bottom Row: Pricing and Reasons */}
                          <div className="mt-4 pt-3 border-t border-gray-50 flex justify-between items-end">
                            <div>
                              <p className="text-[9px] text-gray-400 font-bold uppercase">
                                Price Per Unit
                              </p>
                              <div className="flex items-center gap-2">
                                {med.mrp > med.price && (
                                  <span className="text-xs text-gray-400 line-through">
                                    ₹{med.mrp?.toFixed(2)}
                                  </span>
                                )}
                                <p
                                  className={`text-lg font-black leading-none ${
                                    status === "cancelled"
                                      ? "text-red-600"
                                      : "text-[var(--primary)]"
                                  }`}
                                >
                                  ₹{med.price?.toFixed(2)}
                                </p>
                              </div>
                            </div>

                            {status === "cancelled" && q?.cancelReason && (
                              <div className="text-[10px] text-red-500 italic bg-red-50 px-2 py-1 rounded border border-red-100 max-w-[150px] truncate">
                                Reason: {q.cancelReason}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-full text-center py-10 bg-gray-50 rounded-xl border border-dashed text-gray-400 text-sm">
                    No medicines found in this order.
                  </div>
                )}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <Button
              type="button"
              variant="contained"
              color="success"
              disabled={!hasPending}
              onClick={async (e) => {
                e.preventDefault();
                const selectedMedsArr = order.medicineId.filter((med: any) =>
                  selected.includes(med._id)
                );
                const unselectedMedsArr = order.medicineId.filter(
                  (med: any) => !selected.includes(med._id)
                );
                // If there are no unselected meds, proceed immediately (no reason required)
                if (!unselectedMedsArr.length) {
                  try {
                    const res = await fetch("/api/admin/order/partial-accept", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        orderId,
                        medicineIds: selected,
                        cancelReason: undefined,
                      }),
                    });
                    const data = await res.json();
                    if (data.success) {
                      Swal.fire(
                        "Success",
                        "Selected medicines accepted",
                        "success"
                      );
                      setSelected([]);
                      setCancelReason("");
                      fetchOrder();
                    } else {
                      Swal.fire(
                        "Error",
                        data.message || "Failed to accept",
                        "error"
                      );
                    }
                  } catch (e) {
                    Swal.fire("Error", "Failed to accept", "error");
                  }
                  return;
                }

                // otherwise preview and open styled dialog
                setPreviewSelectedMeds(selectedMedsArr);
                setPreviewUnselectedMeds(unselectedMedsArr);
                setShowCancelReasonDialog(true);
              }}
            >
              Accept Selected
            </Button>
          </div>
        </form>
      </div>
      {/* Cancel reason dialog styled like Reject Prescription */}
      {/* <Dialog
        open={showCancelReasonDialog}
        onClose={() => setShowCancelReasonDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: modalStyles.paper }}
      >
        <DialogTitle>
          <ModalHeader
            title="Confirm Order"
            onClose={() => setShowCancelReasonDialog(false)}
          />
        </DialogTitle>
        <DialogContent sx={modalStyles.content}>
          <Box sx={modalStyles.noticeBox}>
            <p className="text-xs font-semibold text-[var(--status-danger-text)] leading-relaxed">
              <span className="font-bold">Notice:</span>{" "}
              Please provide a reason for cancellation. This note will be sent to the customer.
            </p>
          </Box>
          <div style={{ marginTop: 8 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>
                 Confirm Item
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
                marginBottom: 12,
              }}
            >
              {previewSelectedMeds.length ? (
                previewSelectedMeds.map((m) => (
                  <span
                    key={m._id}
                    style={{
                      background: "#43a047",
                      color: "#fff",
                      padding: "4px 10px",
                      borderRadius: 16,
                      fontSize: 13,
                    }}
                  >
                    {m.name}
                  </span>
                ))
              ) : (
                <div style={{ color: "#888", fontSize: 13 }}>
                  <i>None</i>
                </div>
              )}
            </div>

            {previewUnselectedMeds.length > 0 && (
              <>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>
                  Items to Cancel
                </div>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                    marginBottom: 12,
                  }}
                >
                  {previewUnselectedMeds.map((m) => (
                    <span
                      key={m._id}
                      style={{
                        background: "#fb8c00",
                        color: "#fff",
                        padding: "4px 10px",
                        borderRadius: 16,
                        fontSize: 13,
                      }}
                    >
                      {m.name}
                    </span>
                  ))}
                </div>

                <div className="text-right mb-3">
                  {(() => {
                    const refundAmount = previewUnselectedMeds.reduce((sum, m) => {
                      const q = order?.medicineQuantity?.find(
                        (x: any) =>
                          x.medicineId === m._id ||
                          x.medicineId?.toString?.() === m._id?.toString?.()
                      );
                      const qty = q?.quantity || m.quantity || 1;
                      const price = Number(m.price) || 0;
                      return sum + price * qty;
                    }, 0);
                    return (
                      <div className="text-sm font-semibold text-gray-700">
                        Refund Amount: <span className="font-bold">₹{refundAmount.toFixed(2)}</span>
                      </div>
                    );
                  })()}
                </div>

                <TextField
                  multiline
                  minRows={4}
                  fullWidth
                  autoFocus
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Enter reason for cancellation..."
                  variant="outlined"
                  margin="normal"
                  sx={modalStyles.textField}
                />
              </>
            )}
          </div>
        </DialogContent>
        <DialogActions sx={modalStyles.actions}>
          <Button
            onClick={() => setShowCancelReasonDialog(false)}
            sx={modalStyles.cancelBtn}
          >
            Cancel
          </Button>
          <Button
        onClick={async () => {
              if (
                previewUnselectedMeds.length > 0 &&
                (!cancelReason || !cancelReason.trim())
              )
                return Swal.fire("Warning", "Reason is required!", "warning");
              try {
                const res = await fetch("/api/admin/order/partial-accept", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    orderId,
                    medicineIds: selected,
                    cancelReason:
                      previewUnselectedMeds.length > 0
                        ? cancelReason
                        : undefined,
                  }),
                });
                const data = await res.json();
                if (data.success) {
                  Swal.fire(
                    "Success",
                    "Selected medicines accepted",
                    "success"
                  );
                  setSelected([]);
                  setCancelReason("");
                  setShowCancelReasonDialog(false);
                  fetchOrder();
                } else {
                  Swal.fire(
                    "Error",
                    data.message || "Failed to accept",
                    "error"
                  );
                }
              } catch (e) {
                Swal.fire("Error", "Failed to accept", "error");
              }
            }}
            variant="contained"
            sx={modalStyles.confirmBtn}
            >
            Confirm 
          </Button>
        </DialogActions>
      </Dialog> */}

      <Dialog
        open={showCancelReasonDialog}
        onClose={() => setShowCancelReasonDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: modalStyles.paper }}
      >
        <DialogTitle sx={{ p: 2 }}>
          <ModalHeader
            title="Confirm Order "
            onClose={() => setShowCancelReasonDialog(false)}
          />
        </DialogTitle>

        {/* overflowY: "auto" ensures only the content scrolls, not the whole dialog */}
        <DialogContent
          sx={{ ...modalStyles.content, overflowY: "auto", maxHeight: "70vh" }}
        >
          <Box sx={modalStyles.noticeBox}>
            <Typography variant="caption" sx={modalStyles.noticeText}>
              <span className="font-bold">Notice:</span> Please provide a reason
              for cancellation. This note will be sent to the customer.
            </Typography>
          </Box>

          <Stack spacing={2}>
            {/* Items to Confirm */}
            <Box>
              <Typography sx={modalStyles.sectionHeader}>
                Confirm Items
              </Typography>
              <Box sx={modalStyles.chipContainer}>
                {previewSelectedMeds.length ? (
                  previewSelectedMeds.map((m) => (
                    <Chip
                      key={m._id}
                      label={m.name}
                      size="small"
                      sx={modalStyles.confirmChip}
                    />
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    None
                  </Typography>
                )}
              </Box>
            </Box>

            {/* Items to Cancel */}
            {previewUnselectedMeds.length > 0 && (
              <Box>
                <Typography sx={modalStyles.sectionHeader}>
                  Cancel Items
                </Typography>
                <Box sx={modalStyles.chipContainer}>
                  {previewUnselectedMeds.map((m) => (
                    <Chip
                      key={m._id}
                      label={m.name}
                      size="small"
                      sx={modalStyles.cancelChip}
                    />
                  ))}
                </Box>

                <Box sx={modalStyles.refundBox}>
                  {(() => {
                    const refundAmount = previewUnselectedMeds.reduce(
                      (sum, m) => {
                        const q = order?.medicineQuantity?.find(
                          (x: any) =>
                            x.medicineId === m._id ||
                            x.medicineId?.toString?.() === m._id?.toString?.()
                        );
                        const qty = q?.quantity || m.quantity || 1;
                        const price = Number(m.price) || 0;
                        return sum + price * qty;
                      },
                      0
                    );
                    return (
                      <Typography variant="body2" fontWeight="600">
                        Refund Amount:{" "}
                        <span style={{ color: "#d32f2f" }}>
                          ₹{refundAmount.toFixed(2)}
                        </span>
                      </Typography>
                    );
                  })()}
                </Box>

                <TextField
                  multiline
                  minRows={2} // Reduced rows to save space
                  fullWidth
                  label="Reason for cancellation"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g., Item out of stock..."
                  variant="outlined"
                  sx={modalStyles.textField}
                />
              </Box>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={modalStyles.actions}>
          <Button
            onClick={() => setShowCancelReasonDialog(false)}
            sx={modalStyles.cancelBtn}
          >
            Back
          </Button>
          <Button
            onClick={async () => {
              if (
                previewUnselectedMeds.length > 0 &&
                (!cancelReason || !cancelReason.trim())
              )
                return Swal.fire("Warning", "Reason is required!", "warning");
              try {
                const res = await fetch("/api/admin/order/partial-accept", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    orderId,
                    medicineIds: selected,
                    cancelReason:
                      previewUnselectedMeds.length > 0
                        ? cancelReason
                        : undefined,
                  }),
                });
                const data = await res.json();
                if (data.success) {
                  Swal.fire(
                    "Success",
                    "Selected medicines accepted",
                    "success"
                  );
                  setSelected([]);
                  setCancelReason("");
                  setShowCancelReasonDialog(false);
                  fetchOrder();
                } else {
                  Swal.fire(
                    "Error",
                    data.message || "Failed to accept",
                    "error"
                  );
                }
              } catch (e) {
                Swal.fire("Error", "Failed to accept", "error");
              }
            }}
            variant="contained"
            disableElevation
            sx={modalStyles.confirmBtn}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
      {/* Cancel Selected dialog removed as per request */}
    </div>
  );
}
