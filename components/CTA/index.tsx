"use client";

import React from "react";
import Link from "next/link";

const CTA = () => {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <div className="rounded-3xl bg-blue-600 p-8 text-white">
          <h2 className="text-2xl sm:text-3xl font-bold">Mulai Gunakan Kasir POS Sekarang</h2>
          <p className="text-xs sm:text-sm text-blue-100 mt-2">Sistem kasir modern, antrean otomatis, dan terhubung ke NeonDB.</p>
          <div className="mt-4">
            <Link href="/" className="inline-block rounded-xl bg-white px-6 py-2.5 text-xs sm:text-sm font-bold text-blue-700 shadow-md">
              Buka Layar Kasir
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
