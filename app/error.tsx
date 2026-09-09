"use client";

import React from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <section className="pt-40 pb-24 text-center">
      <div className="mx-auto max-w-md px-4">
        <h1 className="text-2xl font-bold text-red-600">Terjadi Kesalahan</h1>
        <p className="text-xs text-slate-500 mt-2 mb-6">{error.message || "Gagal memuat komponen."}</p>
        <button
          onClick={() => reset()}
          className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white"
        >
          Coba Lagi
        </button>
      </div>
    </section>
  );
}
