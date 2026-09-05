"use client";

import React from "react";
import { Toaster } from "react-hot-toast";

export function ToastContext() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: "#0F172A",
          color: "#FFFFFF",
          borderRadius: "8px",
          border: "1px solid #1E293B",
        },
      }}
    />
  );
}
