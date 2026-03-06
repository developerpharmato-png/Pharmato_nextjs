"use client";

type RejectPrescription = {
  urls: string[];
  rejectedAt: string;
  rejectionReason: string;
};
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Swal from "sweetalert2";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import { getStatusColor } from "@/utils/function";

import { ToastMessages } from "@/utils/ToasterMessage";
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
  CircularProgress,
} from "@mui/material";
import {
  ModalHeader,
  CustomImage,
  CustomButton,
} from "@/app/dashboard/components/miniComponents";
import { modalStyles } from "@/utils/style";
import { Box, Stack } from "@mui/system";
import { downloadImageByUrl, downloadInvoicePDF } from "@/utils/function";
import PartialCancel from "@/app/dashboard/components/skeleton/PartialCancel";
import ProductManageTable from "@/app/dashboard/components/ProductManageTable";
import TextareaField from "@/app/dashboard/components/skeleton/FieldCom";
import OdermangeSkeleton from "@/app/dashboard/components/skeleton/odermangeSkeleton";
import PolicyExpandable from "@/app/dashboard/components/ExpandableText";

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
  const [acceptLoading, setAcceptLoading] = useState(false);
  // Order status update dialog
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [statusToUpdate, setStatusToUpdate] = useState("");
  const [showCancelReasonDialog, setShowCancelReasonDialog] = useState(false);
  const [previewSelectedMeds, setPreviewSelectedMeds] = useState<any[]>([]);
  const [previewUnselectedMeds, setPreviewUnselectedMeds] = useState<any[]>([]);
  const [cancelReasonError, setCancelReasonError] = useState<string>("");
  // Prescription viewer state
  const [showPrescriptionViewer, setShowPrescriptionViewer] = useState(false);
  const [prescriptionViewerIndex, setPrescriptionViewerIndex] = useState(0);
  const [prescriptionZoom, setPrescriptionZoom] = useState(1);
  const statusOptions = [{ value: "Delivered", label: "Delivered" }];

  const medidetails = (_id: String) => {
    router.push(`/dashboard/medicines/${_id}`);
  };

  useEffect(() => {
    if (orderId) fetchOrder();
  }, [orderId]);

  console.log(order?.medicineId, "orderorder");

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
            q.medicineId?.toString ? q.medicineId.toString() : q.medicineId,
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
          title: ToastMessages.PRESCRIPTION_APPROVED,
          showConfirmButton: false,
          timer: 2000,
        });
        setApprovalNotesPresc("");
        fetchOrder();
      } else {
        Swal.fire(
          "Error",
          data.message || ToastMessages.PRESCRIPTION_APPROVE_FAILED,
          "error",
        );
      }
    } catch (e) {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title: ToastMessages.PRESCRIPTION_APPROVE_FAILED,
        showConfirmButton: false,
        timer: 2000,
      });
    } finally {
      setApproveLoading(false);
    }
  };

  const handleRejectPrescription = async () => {
    if (!rejectionReasonPresc.trim()) {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "warning",
        title: ToastMessages.PRESCRIPTION_REJECTION_REASON_REQUIRED,
        showConfirmButton: false,
        timer: 2000,
      });
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
          title: data.message,
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
          "error",
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
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
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

  const handleAcceptSelected = async (e?: React.MouseEvent) => {
    if (e?.preventDefault) e.preventDefault();
    if (!order) return;

    // Validation: Check if prescription is required and approved
    if (
      order.isPrescriptionRequired &&
      order.prescription_status?.toLowerCase() !== "approved"
    ) {
      const result = await Swal.fire({
        title: "Prescription Not Approved",
        text: "The prescription for this order has not been approved yet. Do you still want to proceed with confirming the order?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#10b981", // Success green
        cancelButtonColor: "#f43f5e", // Danger red
        confirmButtonText: "Yes, proceed",
        cancelButtonText: "No, check again",
        reverseButtons: true,
      });

      if (!result.isConfirmed) {
        return;
      }
    }

    const selectedMedsArr = order.medicineId.filter((med: any) =>
      selected.includes(med._id),
    );

    const unselectedMedsArr = order.medicineId.filter(
      (med: any) => !selected.includes(med._id),
    );

    // 🔥 ALWAYS open preview dialog
    setPreviewSelectedMeds(selectedMedsArr);
    setPreviewUnselectedMeds(unselectedMedsArr);
    setShowCancelReasonDialog(true);
  };

  if (loading)
    return (
      <div className="scrollbar-hide containerStyle">
        <OdermangeSkeleton />
      </div>
    );
  if (!order) return null;

  // Check if at least one medicine has status 'pending'
  const hasPending = order?.medicineQuantity?.some(
    (q: any) => q?.status === "pending",
  );
  // collect ids of medicines that are pending
  const pendingMedicineIds: string[] = (order?.medicineQuantity || [])
    .filter((q: any) => q?.status === "pending")
    .map((q: any) =>
      q.medicineId?.toString ? q.medicineId.toString() : q.medicineId,
    );

  const allPendingSelected =
    pendingMedicineIds.length > 0 &&
    pendingMedicineIds.every((id) => selected.includes(id));

  console.log("$$$$$$$pendingMedicineIds$$$$$$$$", pendingMedicineIds);

  const hasPrescriptionImages =
    ((order?.prescription_url || []).filter(Boolean) || []).length > 0;

  const allImageUrls =
    order?.prescription_url?.filter((url: string) => {
      const lower = url.toLowerCase();
      return !lower.endsWith(".pdf") && !lower.includes("/raw/");
    }) || [];

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
        <div className="">
          <HeaderWithAction
            title="Order Details
"
            subtitle={`Order ID: ${order?.order_id}`}
            showBack={true}
            onBack={() => router.back()}
            showSearch={false}
            addShow={false}
          />
        </div>
        {order?.order_status === "Confirmed" && (
          <CustomButton
            width="250px"
            onClick={() => setShowStatusDialog(true)}
            disabled={order?.order_status !== "Confirmed"}
          >
            Update Order
          </CustomButton>
        )}

        {(order?.invoice_url && order?.order_status !== "Confirmed") && (
          <CustomButton onClick={() => downloadInvoicePDF(order?.invoice_url)}>
            Download Invoice
          </CustomButton>
        )}
      </div>

      {/* Order ID and Status block below header */}
      <div style={{ marginBottom: 16, marginTop: -4 }}>
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
                  "error",
                );
              }
            }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {hasPrescriptionImages && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-6">
          {/* Header: Title and Management Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-2 pb-2 border-b border-gray-50">
            <div className="flex items-start gap-3">
              <div className=" bg-blue-50 rounded-lg text-blue-600">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14H7v-2h3v2zm3-4H7v-2h6v2zm3-4H7V7h9v2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800 tracking-tight leading-tight">
                  Prescription Management
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                    {order?.prescription_status || "Pending"}
                  </span>
                </div>
              </div>
            </div>

            {/* COMPACT TOP ACTIONS */}
            {order?.isPrescriptionRequired &&
              order?.prescription_status?.toLowerCase() === "pending" && (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleApprovePrescription}
                    disabled={approveLoading}
                    className="flex-1 sm:flex-none flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold uppercase transition-all disabled:opacity-50 shadow-sm"
                  >
                    {approveLoading ? "..." : "✓"} Approve
                  </button>
                  <button
                    onClick={() => setShowRejectModalPresc(true)}
                    disabled={rejectLoading}
                    className="flex-1 sm:flex-none flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs font-bold uppercase transition-all disabled:opacity-50"
                  >
                    {rejectLoading ? "..." : "✕"} Reject
                  </button>
                </div>
              )}
          </div>
          {/* Document Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {order?.prescription_url?.map((url: string, idx: number) => {
              if (!url) return null;

              const lowerUrl = url.toLowerCase();
              const isPdf = lowerUrl.endsWith(".pdf") || lowerUrl.includes("/raw/");

              return (
                <div
                  key={idx}
                  /* REMOVED: h-[200px] w-[200px] */
                  /* ADDED: w-full (to ensure it fills the grid column) */
                  className="group relative aspect-[6/5] w-full rounded-xl border border-gray-200 overflow-hidden bg-gray-50 hover:shadow-md transition-all"
                >
                  {/* Overlay Download Button */}
                  <button
                    onClick={() => downloadImageByUrl(url)}
                    className="absolute top-2 right-2 z-20 bg-white/90 p-1.5 rounded-lg shadow-sm border border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity text-gray-700 hover:bg-white"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.5"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                  </button>

                  {isPdf ? (
                    <div
                      onClick={() => window.open(url, "_blank")}
                      className="w-full h-full cursor-pointer bg-gradient-to-br from-red-50 to-red-100 flex flex-col items-center justify-center gap-2"
                    >
                      <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center shadow-md text-white">
                        <svg
                          className="w-7 h-7"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-8-6z" />
                        </svg>
                      </div>
                      <span className="text-red-600 font-bold text-[10px] uppercase">
                        View PDF
                      </span>
                    </div>
                  ) : (
                    <CustomImage
                      coverImage={url}
                      images={allImageUrls}
                      alt={`Prescription ${idx + 1}`}
                      style={{
                        height: "100%",
                        width: "100%",
                        objectFit: "contain",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reject prescription dialog */}
      <Dialog
        open={showRejectModalPresc}
        onClose={() => setShowRejectModalPresc(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: modalStyles.paper }}
      >
        <ModalHeader
          title="Reject Prescription"
          onClose={() => setShowRejectModalPresc(false)}
        />{" "}
        <DialogTitle sx={{ p: 2 }}></DialogTitle>
        <DialogContent sx={modalStyles.content}>
          <Box sx={modalStyles.noticeBox}>
            <p className="text-xs font-semibold text-[var(--status-danger-text)] leading-relaxed">
              <span className="font-bold">⚠️ Notice:</span> Please provide a
              clear reason for rejection. This message will be sent to the
              customer.
            </p>
          </Box>
          {/* <TextField
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
          /> */}

          <TextareaField
            id="targetScreen"
            name="alt"
            label=""
            value={rejectionReasonPresc}
            onChange={(e) => setRejectionReasonPresc(e.target.value)}
            placeholder="Enter reason for rejection"
            maxLength={250}
            rows={4}
            showCount={true}
            className="mb-4"
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
            <div>
              <ProductManageTable
                medicines={order?.medicineId || []}
                medicineQuantity={order?.medicineQuantity || []}
                selected={selected}
                setSelected={(s: string[]) => setSelected(s)}
                medidetails={(id: string) => medidetails(id)}
                gridCols="grid-cols-1 lg:grid-cols-2"
                tableMode={true}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <CustomButton
              type="button"
              disabled={!hasPending || order.order_status !== "Order Placed"}
              onClick={handleAcceptSelected}
            >
              Confirm Order
            </CustomButton>
          </div>
        </form>
      </div>

      <Dialog
        open={showCancelReasonDialog}
        onClose={() => setShowCancelReasonDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: modalStyles.paper }}
      >
        <ModalHeader
          title={
            allPendingSelected
              ? "Confirm Selected"
              : "Reason for cancelling remaining items"
          }
          onClose={() => setShowCancelReasonDialog(false)}
        />
        <DialogTitle sx={{ p: 2 }}></DialogTitle>

        {/* overflowY: "auto" ensures only the content scrolls, not the whole dialog */}
        <DialogContent
          sx={{ ...modalStyles.content, overflowY: "auto", maxHeight: "70vh" }}
        >
          {previewUnselectedMeds.length > 0 && (
            <Box sx={modalStyles.noticeBox}>
              <Typography variant="caption" sx={modalStyles.noticeText}>
                <span className="font-bold">Notice:</span> Please provide a
                reason for cancellation. This note will be sent to the customer.
              </Typography>
            </Box>
          )}

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
                    let refundAmount = previewUnselectedMeds.reduce(
                      (sum, m) => {
                        const q = order?.medicineQuantity?.find(
                          (x: any) =>
                            x.medicineId === m._id ||
                            x.medicineId?.toString?.() === m._id?.toString?.(),
                        );
                        const qty = q?.quantity || m.quantity || 1;
                        const price = Number(m.price) || 0;
                        return sum + price * qty;
                      },
                      0,
                    );

                    if (
                      previewSelectedMeds.length === 0 &&
                      order?.calculationData?.deliveryFee
                    ) {
                      refundAmount += order.calculationData.deliveryFee;
                    }

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

                {/* <TextField
                  multiline
                  minRows={2} // Reduced rows to save space
                  fullWidth
                  label="Reason for cancellation"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g., Item out of stock..."
                  variant="outlined"
                  sx={modalStyles.textField}
                /> */}
                <div className="mt-6">
                  <TextareaField
                    id="targetScreen"
                    name="alt"
                    label="Reason for cancellation"
                    value={cancelReason}
                    onChange={(e) => {
                      setCancelReason(e.target.value);
                      // clear inline error when user types
                      try {
                        setCancelReasonError("");
                      } catch (e) { }
                    }}
                    // placeholder="Enter description here"
                    maxLength={200}
                    rows={3}
                    showCount={true}
                    className="mb-4"
                  />
                  {typeof cancelReasonError !== "undefined" &&
                    cancelReasonError ? (
                    <p className="text-sm text-red-600 mt-1">
                      {cancelReasonError}
                    </p>
                  ) : null}
                </div>
              </Box>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={modalStyles.actions}>
          <Button
            onClick={() => {
              setShowCancelReasonDialog(false);
              try {
                setCancelReasonError("");
              } catch (e) { }
            }}
            sx={modalStyles.cancelBtn}
          >
            Back
          </Button>
          <Button
            onClick={async () => {
              if (
                previewUnselectedMeds.length > 0 &&
                (!cancelReason || !cancelReason.trim())
              ) {
                try {
                  setCancelReasonError("Reason is required!");
                } catch (e) { }
                return;
              }
              setAcceptLoading(true);
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
                  Swal.fire({
                    toast: true,
                    position: "top-end",
                    icon: "success",
                    title: ToastMessages.ORDER_ACCEPTED,
                    showConfirmButton: false,
                    timer: 2000,
                  });
                  setSelected([]);
                  setCancelReason("");
                  setShowCancelReasonDialog(false);
                  fetchOrder();
                } else {
                  setShowCancelReasonDialog(false);
                  Swal.fire(
                    "Error",
                    data.message || "Failed to accept",
                    "error",
                  );
                }
              } catch (e) {
                setShowCancelReasonDialog(false);
                Swal.fire("Error", "Failed to accept", "error");
              } finally {
                setShowCancelReasonDialog(false);
                setAcceptLoading(false);
              }
            }}
            variant="contained"
            disabled={acceptLoading}
            disableElevation
            sx={modalStyles.confirmBtn}
          >
            {acceptLoading ? (
              <>
                <CircularProgress size={18} color="inherit" sx={{ mr: 1 }} />
                Confirming...
              </>
            ) : previewUnselectedMeds.length > 0 ? (
              "Confirm "
            ) : (
              "Confirm Selected"
            )}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Cancel Selected dialog removed as per request */}

      {/* Prescription Image Viewer Modal */}
      {showPrescriptionViewer && order?.prescription_url && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-1000 p-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl bg-white rounded-xl shadow-2xl relative p-4">
            {/* Top Right Controls */}
            <div className="absolute top-0 right-0 m-4 flex items-center gap-2 z-10">
              <button
                onClick={() => {
                  const currentUrl =
                    order?.prescription_url?.[prescriptionViewerIndex];
                  if (currentUrl) downloadImageByUrl(currentUrl);
                }}
                className="bg-white/80 text-gray-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold hover:opacity-90"
                title="Download"
              >
                ⬇
              </button>
              <button
                onClick={() =>
                  setPrescriptionZoom((z) =>
                    Math.min(3, +(z + 0.25).toFixed(2)),
                  )
                }
                className="bg-white/80 text-gray-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold hover:opacity-90"
                title="Zoom In"
              >
                +
              </button>
              <button
                onClick={() =>
                  setPrescriptionZoom((z) =>
                    Math.max(1, +(z - 0.25).toFixed(2)),
                  )
                }
                className="bg-white/80 text-gray-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold hover:opacity-90"
                title="Zoom Out"
              >
                −
              </button>
              <button
                onClick={() => setPrescriptionZoom(1)}
                className="bg-white/80 text-gray-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold hover:opacity-90"
                title="Reset Zoom"
              >
                1x
              </button>
              <button
                onClick={() => setShowPrescriptionViewer(false)}
                className="bg-white/80 text-gray-800 rounded-full w-8 h-8 flex items-center justify-center text-xl font-bold hover:opacity-90"
                title="Close"
              >
                ×
              </button>
            </div>

            {/* Swiper Gallery */}
            <Swiper
              initialSlide={prescriptionViewerIndex}
              spaceBetween={10}
              slidesPerView={1}
              pagination={{ clickable: true }}
              modules={[Pagination]}
              className="w-full h-[70vh] max-h-[700px] rounded-xl overflow-hidden"
              onSlideChange={(swiper) => {
                setPrescriptionViewerIndex(swiper.activeIndex);
                setPrescriptionZoom(1);
              }}
            >
              {order?.prescription_url?.map(
                (url: string, idx: number) =>
                  url && (
                    <SwiperSlide
                      key={idx}
                      className="flex items-center justify-center bg-gray-100 rounded-xl"
                    >
                      <div className="w-full h-full flex items-center justify-center p-4">
                        <img
                          src={url}
                          alt={`Prescription ${idx + 1}`}
                          className="max-w-full w-full h-full object-contain"
                          style={{
                            transform: `scale(${prescriptionZoom})`,
                            transition: "transform 0.15s",
                          }}
                        />
                      </div>
                    </SwiperSlide>
                  ),
              )}
            </Swiper>

            {/* Footer Info */}
            <div className="flex items-center justify-between text-gray-700 font-semibold border-t border-gray-200 mt-2 px-3 py-2">
              <div>
                Viewing Image {prescriptionViewerIndex + 1} of{" "}
                {order?.prescription_url?.filter(Boolean).length || 0}
              </div>
              <div className="text-sm text-gray-600">
                Zoom: {prescriptionZoom.toFixed(2)}x
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6 mt-6">
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
                    {order?.deliveredAddress?.address?.houseNumber},
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
                    {order.deliveredAddress.email || "No email provided"}
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
                    {`+91 ${order.deliveredAddress.phone}`}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

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
                        order?.order_status,
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
                        order?.payment_status,
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
                  {order?.discount ? (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Discount</span>
                      <span className="font-bold text-red-600 uppercase">
                        {" "}
                        {order?.discount > 0 ? `- ₹${order?.discount.toFixed(2)}` : "-"}
                      </span>
                    </div>
                  ) : ""}

                  {/* <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Platform Fee</span>
                    <span className="font-bold text-gray-700">
                      {" "}   
                      
                      {order?.calculationData?.platformFee +
                        order?.calculationData?.razorPayCommissionGstAmount +
                        order?.calculationData?.razorPayCommissionAmount}
                    </span>
                  </div> */}
                  <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-800">
                      Final Payable
                    </span>
                    <span className=" font-black text-green-600">
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
                    {order?.payment_status == "captured" ||
                      order?.payment_status == "Deducted From Wallet"
                      ? " Payment Received"
                      : "Awaiting Payment"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- MARG ORDER DETAILS CARD --- */}
        {order?.margOrderNo && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-3">
                <div className="w-5 h-5 text-blue-600">
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
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-gray-800 tracking-tight">
                  Marg Order Details
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Integration Status */}
                <div className="space-y-5">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                      Marg Order No
                    </p>
                    <p className="font-bold text-sm text-blue-600">
                      {order?.margOrderNo}
                    </p>
                  </div>
                  {order?.margOrderInsertData?.Details?.CustomerID && (
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                        Customer ID
                      </p>
                      <p className="text-sm font-bold text-gray-800">
                        {order?.margOrderInsertData?.Details?.CustomerID}
                      </p>
                    </div>
                  )}
                  {order?.margOrderInsertData?.Details?.Message && (
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                        Status Message
                      </p>
                      <p className="text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        {order?.margOrderInsertData?.Details?.Message}
                      </p>
                    </div>
                  )}
                </div>

                {/* Dispatch Details */}
                {order?.margOrderDispatchData && (
                  <div className="lg:col-span-2 bg-gray-50 rounded-xl p-5 border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4">
                      Dispatch Information
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                      {/* Removed Marg Order ID */}
                      {order?.margOrderDispatchData?.datesub && (
                        <div className="flex justify-between items-center sm:block">
                          <span className="text-xs text-gray-500 sm:mb-1 block">
                            Submitted Date
                          </span>
                          <span className="text-sm font-medium text-gray-700">
                            {order?.margOrderDispatchData?.datesub}
                          </span>
                        </div>
                      )}
                      {order?.margOrderDispatchData?.dateisu && (
                        <div className="flex justify-between items-center sm:block">
                          <span className="text-xs text-gray-500 sm:mb-1 block">
                            Issued Date
                          </span>
                          <span className="text-sm font-medium text-gray-700">
                            {order?.margOrderDispatchData?.dateisu}
                          </span>
                        </div>
                      )}
                      {order?.margOrderDispatchData?.datedis && (
                        <div className="flex justify-between items-center sm:block">
                          <span className="text-xs text-gray-500 sm:mb-1 block">
                            Dispatch Date
                          </span>
                          <span className="text-sm font-medium text-gray-700">
                            {order?.margOrderDispatchData?.datedis}
                          </span>
                        </div>
                      )}
                      {order?.margOrderDispatchData?.Is_Deleted === 1 && (
                        <>
                          <div className="flex justify-between items-center sm:block">
                            <span className="text-xs text-gray-500 sm:mb-1 block">
                              Process Status
                            </span>
                            <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tighter bg-red-100 text-red-600">
                              Deleted
                            </span>
                          </div>
                          {order?.margOrderDispatchData?.deleted_date && (
                            <div className="flex justify-between items-center sm:block">
                              <span className="text-xs text-red-400 sm:mb-1 block">
                                Deletion Date
                              </span>
                              <span className="text-sm font-medium text-red-600">
                                {order?.margOrderDispatchData?.deleted_date}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- REJECTED PRESCRIPTIONS --- */}
        {order?.reject_prescription_url &&
          order.reject_prescription_url.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-red-100 p-6 mt-6 mb-6">
              <div className="flex items-center gap-2 mb-4 border-b border-red-50 pb-3">
                <div className="p-1.5 bg-red-50 rounded-lg text-red-600">
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
                      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-gray-800 tracking-tight">
                  Rejected Prescriptions
                </h2>
              </div>
              <div className="w-full space-y-6">
                {order?.reject_prescription_url?.map((urlObj: RejectPrescription, idx: number) => {
                  const imageUrls =
                    urlObj.urls?.filter((u) => {
                      const l = u.toLowerCase();
                      return !l.endsWith(".pdf") && !l.includes("/raw/");
                    }) || [];

                  const pdfUrls =
                    urlObj.urls?.filter((u) => {
                      const l = u.toLowerCase();
                      return l.endsWith(".pdf") || l.includes("/raw/");
                    }) || [];

                  return (
                    <div
                      key={idx}
                      className="w-full flex flex-col md:flex-row rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"
                    >
                      {/* LEFT SIDE */}
                      <div className="p-6 flex-[3]">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                          {imageUrls.map((url, imgIdx) => (
                            <CustomImage
                              key={imgIdx}
                              coverImage={url}
                              images={imageUrls}
                              alt={`Rejected Prescription ${idx + 1}`}
                              style={{
                                height: 160,
                                width: 160,
                                objectFit: "cover",
                                borderRadius: "12px",
                                border: "1px solid #eee",
                              }}
                            />
                          ))}

                          {pdfUrls.map((url, pdfIdx) => (
                            <div
                              key={pdfIdx}
                              onClick={() => window.open(url, "_blank")}
                              className="h-[160px] w-[160px] rounded-lg border border-gray-200 bg-gradient-to-br from-red-50 to-red-100 flex flex-col items-center justify-center gap-2 cursor-pointer hover:shadow-md transition-all"
                            >
                              <span className="text-red-600 font-bold text-sm">
                                PDF
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* RIGHT SIDE */}
                      <div className="p-6 flex-[1] border-t md:border-t-0 md:border-l border-gray-100 bg-gray-50 space-y-4">
                        {urlObj.rejectedAt && (
                          <div>
                            <div className="text-sm font-semibold text-gray-800">
                              Rejected On
                            </div>
                            <div className="text-sm text-gray-600">
                              {urlObj.rejectedAt}
                            </div>
                          </div>
                        )}

                        {urlObj.rejectionReason && (
                          <div>
                            <div className="text-sm font-semibold text-gray-800">
                              Reason
                            </div>
                            <div className="mt-1 bg-red-100 text-red-700 px-3 py-2 rounded-md text-sm inline-block">
                              {urlObj.rejectionReason}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
      </div>

      {(order?.privacyPolicy || order?.termAndCondition) && (
        <div className="space-y-8 mt-10 mb-12">
          {order?.privacyPolicy && (
            <PolicyExpandable
              title="Privacy Policy"
              htmlContent={order.privacyPolicy}
            />
          )}
          {order?.termAndCondition && (
            <PolicyExpandable
              title="Terms & Conditions"
              htmlContent={order.termAndCondition}
            />
          )}
        </div>
      )}
    </div>
  );
}
