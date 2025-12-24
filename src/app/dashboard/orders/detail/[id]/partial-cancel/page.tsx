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
import { ModalHeader } from "@/app/dashboard/components/miniComponents";
import { modalStyles } from "@/utils/style";
import { Box } from "@mui/system";

export default function PartialCancelPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params?.id as string;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [cancelReason, setCancelReason] = useState("");
  const [showDialog, setShowDialog] = useState(false);

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
      if (data.success) setOrder(data.data);
      else {
        Swal.fire("Error", data.message || "Order not found", "error");
        router.push("/dashboard/orders");
      }
    } finally {
      setLoading(false);
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-6">
        <h2 className="text-xl font-bold mb-4">Select Medicines to Cancel</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setShowDialog(true);
          }}
        >
          <div className="space-y-3 mb-6">
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
          <Button
            type="submit"
            variant="contained"
            color="error"
            sx={modalStyles.confirmBtn}
            disabled={!hasPending}
          >
            Cancel Selected
          </Button>
        </form>
      </div>
      <Dialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: modalStyles.paper }}
      >
        <DialogTitle>
          <ModalHeader
            title="Cancel Selected Medicines"
            onClose={() => setShowDialog(false)}
          />
        </DialogTitle>

        <DialogContent sx={modalStyles.content}>
          {/* Reusable Notice Box using the constant */}
          <Box sx={modalStyles.noticeBox}>
            <p className="text-xs font-semibold text-[var(--status-danger-text)] leading-relaxed">
              <span className="font-bold">⚠️ Notice:</span> Please provide a
              clear reason for Cancel.
            </p>
          </Box>

          <TextField
            multiline
            minRows={4}
            fullWidth
            autoFocus
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Reason for cancellation"
            variant="outlined"
            margin="normal"
            sx={modalStyles.textField}
          />
        </DialogContent>

        <DialogActions sx={modalStyles.actions}>
          <Button
            onClick={() => setShowDialog(false)}
            sx={modalStyles.cancelBtn}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCancel}
            variant="contained"
            disabled={!cancelReason.trim()}
            sx={modalStyles.confirmBtn}
          >
            Confirm Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
