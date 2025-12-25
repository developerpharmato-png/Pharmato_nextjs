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
} from "@mui/material";
import { ModalHeader, CustomImage } from "@/app/dashboard/components/miniComponents";
import { modalStyles } from "@/utils/style";
import { Box } from "@mui/system";
import { downloadImageByUrl } from '@/utils/function';

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
          .map((q: any) => (q.medicineId?.toString ? q.medicineId.toString() : q.medicineId));
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
      const adminData = localStorage.getItem('admin');
      const admin = adminData ? JSON.parse(adminData) : null;
      const res = await fetch('/api/admin/order/prescription/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, adminId: admin?._id, approvalNotes: approvalNotesPresc || undefined })
      });
      const data = await res.json();
      if (data.success) {
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Prescription approved successfully', showConfirmButton: false, timer: 2000 });
        setApprovalNotesPresc('');
        fetchOrder();
      } else {
        Swal.fire('Error', data.message || 'Failed to approve prescription', 'error');
      }
    } catch (e) {
      Swal.fire('Error', 'Failed to approve prescription', 'error');
    } finally {
      setApproveLoading(false);
    }
  };

  const handleRejectPrescription = async () => {
    if (!rejectionReasonPresc.trim()) {
      Swal.fire('Warning', 'Provide rejection reason', 'warning');
      return;
    }
    setRejectLoading(true);
    try {
      const adminData = localStorage.getItem('admin');
      const admin = adminData ? JSON.parse(adminData) : null;
      const res = await fetch('/api/admin/order/prescription/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, adminId: admin?._id, rejectionReason: rejectionReasonPresc })
      });
      const data = await res.json();
      if (data.success) {
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Prescription rejected', showConfirmButton: false, timer: 2000 });
        setRejectionReasonPresc('');
        setShowRejectModalPresc(false);
        fetchOrder();
      } else {
        Swal.fire('Error', data.message || 'Failed to reject prescription', 'error');
      }
    } catch (e) {
      Swal.fire('Error', 'Failed to reject prescription', 'error');
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

  if (loading) return <div className="p-8">Loading...</div>;
  if (!order) return null;

  // Check if at least one medicine has status 'pending'
  const hasPending = order?.medicineQuantity?.some((q: any) => q?.status === "pending");
  // collect ids of medicines that are pending
  const pendingMedicineIds: string[] = (order?.medicineQuantity || [])
    .filter((q: any) => q?.status === "pending")
    .map((q: any) => (q.medicineId?.toString ? q.medicineId.toString() : q.medicineId));

  console.log("$$$$$$$pendingMedicineIds$$$$$$$$", pendingMedicineIds);

  return (
    <div className="containerStyle">
      <HeaderWithAction
        title="Manage Order"
        subtitle={`Order ID: ${order.order_id}`}
        showBack={true}
        onBack={() => router.push(`/dashboard/orders/detail/${orderId}`)}
        showSearch={false}
        addShow={false}
      />




      {/* Prescription Management (similar to Order Details) */}
      <div className="bg-[var(--background)] rounded-xl shadow-sm border border-gray-100 p-6 mt-6">
        <h2 className="text-xl font-bold mb-6 text-[var(--foreground)] border-b border-gray-100 pb-3">
          Prescription Management
        </h2>

        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Current Status</p>
              <div className="mt-1">
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">{order?.prescription_status || 'Pending'}</span>
              </div>
            </div>

            {order?.isPrescriptionRequired && order?.prescription_status?.toLowerCase() == 'pending' && (
              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  onClick={handleApprovePrescription}
                  disabled={approveLoading}
                  className="flex-1 sm:flex-none px-6 py-2.5 bg-[var(--primary)] text-white text-sm font-bold rounded-lg hover:opacity-90 transition-all shadow-sm"
                >
                  {approveLoading ? 'Approving...' : 'Approve'}
                </button>
                <button
                  onClick={() => setShowRejectModalPresc(true)}
                  disabled={rejectLoading}
                  className="flex-1 sm:flex-none px-6 py-2.5 bg-white border-2 border-[var(--status-danger-text)] text-[var(--status-danger-text)] text-sm font-bold rounded-lg hover:bg-[var(--status-danger-bg)] transition-all"
                >
                  {rejectLoading ? 'Rejecting...' : 'Reject'}
                </button>
              </div>
            )}
          </div>

          {/* Prescription documents grid */}
          {order?.prescription_url && order.prescription_url.length > 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {order.prescription_url.map((url: string, idx: number) => {
                  const isPdf = url.toLowerCase().endsWith('.pdf');
                  return (
                    <div key={idx} className="group relative border border-gray-200 rounded-xl overflow-hidden bg-white hover:border-[var(--secondary)] transition-all shadow-sm">
                      {isPdf ? (
                        <div className="flex flex-col items-center justify-center p-6 h-40 bg-gray-50">
                          <svg className="w-10 h-10 text-[var(--status-danger-text)] mb-2" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 012-2h4.586A1 1 0 0111.293 2.707l3 3a1 1 0 01.293.707V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" /></svg>
                          <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-[var(--primary)] hover:underline">VIEW PDF</a>
                        </div>
                      ) : (
                        <div className="relative h-40 w-full">
                          <CustomImage coverImage={url} images={[url]} alt={`Prescription ${idx + 1}`} style={{ height: '100%', width: '100%', objectFit: 'cover' }} />
                          <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => downloadImageByUrl(url)} className="bg-white/90 px-2 py-1 rounded text-xs font-bold shadow" title="Download">Download</button>
                          </div>
                        </div>
                      )}
                      <div className="p-2.5 bg-white border-t border-gray-100 text-center"><span className="text-[10px] font-bold text-gray-400 uppercase">Page {idx + 1}</span></div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reject prescription dialog */}
      <Dialog open={showRejectModalPresc} onClose={() => setShowRejectModalPresc(false)} maxWidth="sm" fullWidth PaperProps={{ sx: modalStyles.paper }}>
        <DialogTitle>
          <ModalHeader title="Reject Prescription" onClose={() => setShowRejectModalPresc(false)} />
        </DialogTitle>
        <DialogContent sx={modalStyles.content}>
          <Box sx={modalStyles.noticeBox}>
            <p className="text-xs font-semibold text-[var(--status-danger-text)] leading-relaxed"><span className="font-bold">⚠️ Notice:</span> Please provide a clear reason for rejection. This message will be sent to the customer.</p>
          </Box>
          <TextField multiline minRows={4} fullWidth autoFocus value={rejectionReasonPresc} onChange={(e) => setRejectionReasonPresc(e.target.value)} placeholder="e.g., Signature not visible" variant="outlined" margin="normal" sx={modalStyles.textField} />
        </DialogContent>
        <DialogActions sx={modalStyles.actions}>
          <Button onClick={() => setShowRejectModalPresc(false)} sx={modalStyles.cancelBtn}>Cancel</Button>
          <Button onClick={handleRejectPrescription} variant="contained" disabled={!rejectionReasonPresc.trim() || rejectLoading} sx={modalStyles.confirmBtn}>{rejectLoading ? 'Rejecting...' : 'Reject Document'}</Button>
        </DialogActions>
      </Dialog>

      {/* --- End Prescription Management --- */}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-6">
        <h2 className="text-xl font-bold mb-4">Ordered Medicines List</h2>
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
                    setSelected((prev) => Array.from(new Set([...prev, ...pendingMedicineIds])));
                  } else {
                    // remove all pending ids from selected
                    setSelected((prev) => prev.filter((id) => !pendingMedicineIds.includes(id)));
                  }
                }}
                disabled={pendingMedicineIds.length === 0}
              />
              <div className="text-sm font-medium">Select all pending</div>
            </div>
            {order.medicineId && order.medicineId.length > 0 ? (
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
            )}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Button
              type="button"
              variant="contained"
              color="success"
              disabled={!hasPending}
              onClick={async (e) => {
                e.preventDefault();
                // Prepare medicine name lists

                const selectedMedsArr = order.medicineId.filter((med: any) => selected.includes(med._id));
                const unselectedMedsArr = order.medicineId.filter((med: any) => !selected.includes(med._id));

                const renderMedList = (arr: any[], badgeColor: string) =>
                  arr.length
                    ? `<div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:6px;">${arr
                      .map(
                        (med) =>
                          `<span style="background:${badgeColor};color:#fff;padding:4px 10px;border-radius:16px;font-size:13px;">${med.name}</span>`
                      )
                      .join('')}</div>`
                    : `<div style="margin-top:6px;color:#888;font-size:13px;"><i>None</i></div>`;

                const htmlContent = `
                  <div style="text-align:left;max-width:480px;margin:0 auto;">
                    <div style="font-weight:600;font-size:15px;margin-bottom:4px;">Selected Medicines</div>
                    <div style="background:#e8f5e9;padding:10px 12px;border-radius:10px;box-shadow:0 1px 4px #0001;">
                      ${renderMedList(selectedMedsArr, '#43a047')}
                    </div>
                    <div style="font-weight:600;font-size:15px;margin:18px 0 4px 0;">Unselected Medicines</div>
                    <div style="background:#fff3e0;padding:10px 12px;border-radius:10px;box-shadow:0 1px 4px #0001;">
                      ${renderMedList(unselectedMedsArr, '#fb8c00')}
                    </div>
                  </div>
                `;

                const { value: reason } = await Swal.fire({
                  title: 'Reason for cancelling non-selected medicines',
                  html: htmlContent + '<textarea id="swal-input1" class="swal2-textarea" placeholder="Enter reason for cancellation..."></textarea>',
                  focusConfirm: false,
                  preConfirm: () => {
                    const val = (document.getElementById('swal-input1') as HTMLTextAreaElement)?.value;
                    if (!val || !val.trim()) return Swal.showValidationMessage('Reason is required!');
                    return val;
                  },
                  showCancelButton: true,
                  confirmButtonText: 'Proceed',
                  cancelButtonText: 'Cancel',
                });
                if (!reason) return;
                try {
                  const res = await fetch("/api/admin/order/partial-accept", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ orderId, medicineIds: selected, cancelReason: reason }),
                  });
                  const data = await res.json();
                  if (data.success) {
                    Swal.fire("Success", "Selected medicines accepted", "success");
                    setSelected([]);
                    setCancelReason("");
                    fetchOrder();
                  } else {
                    Swal.fire("Error", data.message || "Failed to accept", "error");
                  }
                } catch (e) {
                  Swal.fire("Error", "Failed to accept", "error");
                }
              }}
            >
              Accept Selected
            </Button>
          </div>
        </form>
      </div>
      {/* Cancel Selected dialog removed as per request */}
    </div>
  );
}
