"use client";
import React from "react";
import { ToastContainer, toast, ToastOptions, TypeOptions } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface ToastProps {
  message: string;
  type?: TypeOptions;
  duration?: number;
}

export default function Toast({ message, type = "success", duration = 3000 }: ToastProps) {
  React.useEffect(() => {
    toast(message, {
      type,
      autoClose: duration,
      position: "top-right",
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  }, [message, type, duration]);

  return <ToastContainer />;
}
