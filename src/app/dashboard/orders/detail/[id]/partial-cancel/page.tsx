"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Swal from "sweetalert2";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
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
import { downloadImageByUrl } from "@/utils/function";
import PartialCancel from "@/app/dashboard/components/skeleton/PartialCancel";
import ProductManageTable from "@/app/dashboard/components/ProductManageTable";
import TextareaField from "@/app/dashboard/components/skeleton/FieldCom";
import OdermangeSkeleton from "@/app/dashboard/components/skeleton/odermangeSkeleton";

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
          "error"
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
          title:   data.message,
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

  // const handleAcceptSelected = async (e?: React.MouseEvent) => {
  //   if (e && typeof (e as any).preventDefault === "function")
  //     (e as any).preventDefault();
  //   if (!order) return;

  //   const selectedMedsArr = order.medicineId.filter((med: any) =>
  //     selected.includes(med._id)
  //   );
  //   const unselectedMedsArr = order.medicineId.filter(
  //     (med: any) => !selected.includes(med._id)
  //   );

  //   // If there are no unselected meds, proceed immediately (no reason required)
  //   if (!unselectedMedsArr.length) {
  //     try {
  //       const res = await fetch("/api/admin/order/partial-accept", {
  //         method: "POST",
  //         headers: { "Content-Type": "application/json" },
  //         body: JSON.stringify({
  //           orderId,
  //           medicineIds: selected,
  //           cancelReason: undefined,
  //         }),
  //       });
  //       const data = await res.json();
  //       if (data.success) {
  //         setToastMsg("Selected medicines accepted");
  //         setTimeout(() => setToastMsg(""), 3500);
  //         setSelected([]);
  //         setCancelReason("");
  //         fetchOrder();
  //       } else {
  //         Swal.fire("Error", data.message || "Failed to accept", "error");
  //       }
  //     } catch (e) {
  //       Swal.fire("Error", "Failed to accept", "error");
  //     }
  //     return;
  //   }

  //   // otherwise preview and open styled dialog
  //   setPreviewSelectedMeds(selectedMedsArr);
  //   setPreviewUnselectedMeds(unselectedMedsArr);
  //   setShowCancelReasonDialog(true);
  // };

  const handleAcceptSelected = async (e?: React.MouseEvent) => {
    if (e?.preventDefault) e.preventDefault();
    if (!order) return;

    const selectedMedsArr = order.medicineId.filter((med: any) =>
      selected.includes(med._id)
    );

    const unselectedMedsArr = order.medicineId.filter(
      (med: any) => !selected.includes(med._id)
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
    (q: any) => q?.status === "pending"
  );
  // collect ids of medicines that are pending
  const pendingMedicineIds: string[] = (order?.medicineQuantity || [])
    .filter((q: any) => q?.status === "pending")
    .map((q: any) =>
      q.medicineId?.toString ? q.medicineId.toString() : q.medicineId
    );

  const allPendingSelected =
    pendingMedicineIds.length > 0 &&
    pendingMedicineIds.every((id) => selected.includes(id));

  console.log("$$$$$$$pendingMedicineIds$$$$$$$$", pendingMedicineIds);

  const hasPrescriptionImages =
    ((order?.prescription_url || []).filter(Boolean) || []).length > 0;

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
        <CustomButton
          width="250px"
          onClick={() => setShowStatusDialog(true)}
          disabled={order?.order_status !== 'Confirmed'}
        >
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

      {hasPrescriptionImages && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-6">
          {/* Header: Title and Status Badge */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14H7v-2h3v2zm3-4H7v-2h6v2zm3-4H7V7h9v2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800 tracking-tight">
                  Prescription Management
                </h2>
                <p className="text-sm text-gray-400 font-medium">
                  Attached files for verification
                </p>
              </div>
            </div>

            <span className="px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest bg-amber-50 text-amber-600 border border-amber-100">
              {order?.prescription_status || "Verification Pending"}
            </span>
          </div>

          {/* Document Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[0, 1, 2, 3].map((idx) => {
              const url = order?.prescription_url?.[idx];

              if (!url) {
                return null; // Changed from <></> to null for cleaner mapping
              }

              // Treat Cloudinary raw assets (no extension, /raw/ in path) as PDF so we render the iframe preview
              const lowerUrl = url.toLowerCase();
              const isPdf = lowerUrl.endsWith(".pdf") || lowerUrl.includes("/raw/");
              // For raw Cloudinary links, disable attachment disposition so the browser can inline it; fall back to gview if still blocked
              const inlineUrl = isPdf && lowerUrl.includes("/raw/")
                ? `${url}${url.includes("?") ? "&" : "?"}fl_attachment=false`
                : url;
              const pdfViewerUrl = isPdf && !lowerUrl.endsWith(".pdf")
                ? `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(inlineUrl)}`
                : inlineUrl;

              return (
                <div
                  key={idx}
                  className="flex flex-col rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm h-full"
                >
                  {/* Image/PDF Container */}
                  <div className="relative flex-1 bg-gray-50 min-h-40">
                    {/* Download Button - Fixed to Top Right, Always Visible */}
                    <button
                      onClick={() => downloadImageByUrl(url)}
                      className="absolute top-2 right-2 z-20 bg-white/90 p-1.5 rounded-lg shadow-md border border-gray-100 hover:bg-white transition-all text-gray-700"
                      title="Download File"
                    >
                      <svg
                        className="w-4 h-4"
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
                      <div className="w-full h-full bg-gradient-to-br from-red-50 to-red-100 flex flex-col items-center justify-center gap-3">
                        {/* PDF Icon */}
                        <div className="w-16 h-16 bg-red-500 rounded-lg flex items-center justify-center shadow-lg">
                          <svg
                            className="w-10 h-10 text-white"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-8-6z" />
                          </svg>
                        </div>
                        {/* PDF Label */}
                        <span className="text-red-600 font-bold text-sm tracking-widest uppercase">
                          PDF Document
                        </span>
                      </div>
                    ) : (
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
                    )}
                  </div>

                  {/* View Button at Bottom */}
                  <button
                    onClick={() => {
                      const lowerUrl = url.toLowerCase();
                      const isPdf = lowerUrl.endsWith(".pdf") || lowerUrl.includes("/raw/");

                      if (isPdf) {
                        // Open PDF in new tab
                        window.open(url, '_blank');
                      } else {
                        // Open image in Swiper gallery
                        setPrescriptionViewerIndex(idx);
                        setPrescriptionZoom(1);
                        setShowPrescriptionViewer(true);
                      }
                    }}
                    className="w-full py-3 text-center font-bold text-sm uppercase tracking-wide text-teal-600 hover:bg-teal-50 transition-all border-t border-gray-200"
                  >
                    View
                  </button>
                </div>
              );
            })}
          </div>

          {/* Large Footer Action Buttons */}
          {order?.isPrescriptionRequired &&
            order?.prescription_status?.toLowerCase() === "pending" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-10">
                <button
                  onClick={handleApprovePrescription}
                  disabled={approveLoading}
                  className="flex items-center justify-center gap-3 py-4 border-2 border-green-500 rounded-xl text-green-600 font-bold text-sm uppercase tracking-wide hover:bg-green-50 transition-all disabled:opacity-50"
                >
                  <div className="w-5 h-5 rounded-full border-2 border-green-500 flex items-center justify-center text-[10px]">
                    {approveLoading ? "..." : "✓"}
                  </div>
                  {approveLoading ? "Approving..." : "Approve Prescription"}
                </button>

                <button
                  onClick={() => setShowRejectModalPresc(true)}
                  disabled={rejectLoading}
                  className="flex items-center justify-center gap-3 py-4 border-2 border-red-500 rounded-xl text-red-500 font-bold text-sm uppercase tracking-wide hover:bg-red-50 transition-all disabled:opacity-50"
                >
                  <div className="w-5 h-5 rounded-full border-2 border-red-500 flex items-center justify-center text-[10px]">
                    {rejectLoading ? "..." : "✕"}
                  </div>
                  {rejectLoading ? "Rejecting..." : "Reject Prescription"}
                </button>
              </div>
            )}
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
        /> <DialogTitle sx={{ p: 2 }}>

        </DialogTitle>



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
        <DialogTitle sx={{ p: 2 }}>

        </DialogTitle>

        {/* overflowY: "auto" ensures only the content scrolls, not the whole dialog */}
        <DialogContent
          sx={{ ...modalStyles.content, overflowY: "auto", maxHeight: "70vh" }}
        >

          {previewUnselectedMeds.length > 0 && (
            <Box sx={modalStyles.noticeBox}>
              <Typography variant="caption" sx={modalStyles.noticeText}>
                <span className="font-bold">Notice:</span> Please provide a reason
                for cancellation. This note will be sent to the customer.
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
                    // orderId,
                    // medicineIds: selected,
                    // cancelReason:
                    //   previewUnselectedMeds.length > 0
                    //     ? cancelReason
                    //     : undefined,
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
                    setShowCancelReasonDialog(false)
                  Swal.fire(
                    "Error",
                    data.message || "Failed to accept",
                    "error"
                  );
                }
              } catch (e) {
                setShowCancelReasonDialog(false)
                Swal.fire("Error", "Failed to accept", "error");
              } finally {
                  setShowCancelReasonDialog(false)
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
            ) : (
              previewUnselectedMeds.length > 0 ? "Confirm " : "Confirm Selected"
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
                  const currentUrl = order?.prescription_url?.[prescriptionViewerIndex];
                  if (currentUrl) downloadImageByUrl(currentUrl);
                }}
                className="bg-white/80 text-gray-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold hover:opacity-90"
                title="Download"
              >
                ⬇
              </button>
              <button
                onClick={() => setPrescriptionZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)))}
                className="bg-white/80 text-gray-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold hover:opacity-90"
                title="Zoom In"
              >
                +
              </button>
              <button
                onClick={() => setPrescriptionZoom((z) => Math.max(1, +(z - 0.25).toFixed(2)))}
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
              {order?.prescription_url?.map((url: string, idx: number) => (
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
                        style={{ transform: `scale(${prescriptionZoom})`, transition: "transform 0.15s" }}
                      />
                    </div>
                  </SwiperSlide>
                )
              ))}
            </Swiper>

            {/* Footer Info */}
            <div className="flex items-center justify-between text-gray-700 font-semibold border-t border-gray-200 mt-2 px-3 py-2">
              <div>Viewing Image {prescriptionViewerIndex + 1} of {order?.prescription_url?.filter(Boolean).length || 0}</div>
              <div className="text-sm text-gray-600">Zoom: {prescriptionZoom.toFixed(2)}x</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
