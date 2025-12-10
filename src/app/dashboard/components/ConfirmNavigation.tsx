"use client";
import Swal from "sweetalert2";

type Options = {
  title?: string;
  text?: string;
  confirmText?: string;
  cancelText?: string;
};

export async function showUnsavedConfirm(options?: Options) {
  const res = await Swal.fire({
    icon: "warning",
    title: options?.title || "Unsaved changes",
    text:
      options?.text || "Your data is not saved. Are you sure you want to leave?",
    showCancelButton: true,
    confirmButtonText: options?.confirmText || "OK",
    cancelButtonText: options?.cancelText || "Cancel",
    reverseButtons: true,
  });
  return !!res.isConfirmed;
}

export default showUnsavedConfirm;
    