// src/app/dashboard/components/ConfirmStatusAlert.tsx
import Swal from "sweetalert2";
import React from "react";

type ConfirmStatusAlertProps = {
  onConfirm: () => void;
  onCancel?: () => void;
  isActive: boolean;
  confirmText?: string;
  cancelText?: string;
  title?: string;
  text?: string;
};

export function showConfirmStatusAlert({
  onConfirm,
  onCancel,
  isActive,
  confirmText = isActive ? "Deactivate" : "Activate",
  cancelText = "Cancel",
  title = isActive ? "Deactivate Status?" : "Activate Status?",
  text = isActive
    ? "Are you sure you want to deactivate this item?"
    : "Are you sure you want to activate this item?",
}: ConfirmStatusAlertProps) {
  Swal.fire({
    title,
    text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#16a34a",
    cancelButtonColor: "#f3f4f6",
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true,
    customClass: {
      popup: "rounded-xl shadow-lg border border-gray-200",
      title: "font-bold text-lg text-gray-900",
      htmlContainer: "text-base text-gray-700",
      confirmButton: "!bg-green-600 !text-white !rounded-lg !px-6 !py-2 !font-semibold !text-base !cursor-pointer",
      cancelButton: "!bg-gray-100 !text-gray-700 !rounded-lg !px-6 !py-2 !font-semibold !text-base !cursor-pointer !mr-4",
    },
    buttonsStyling: false,
  }).then((result) => {
    if (result.isConfirmed) {
      onConfirm();
    } else if (onCancel) {
      onCancel();
    }
  });
}