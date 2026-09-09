"use client";

import React from "react";
import Link from "next/link";

const Hero = () => {
  return (
    <section className="relative overflow-hidden pt-28 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white">
          Aplikasi POS Kasir Modern
        </h1>
        <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-400">
          Kasir Cafe &amp; Restoran dengan Antrean Otomatis, Pembayaran Cash &amp; QRIS, dan Integrasi NeonDB.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/" className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-blue-700">
            Buka Kasir
          </Link>
          <Link href="/upload-qris" className="rounded-xl border border-blue-200 bg-white px-5 py-2.5 text-xs sm:text-sm font-bold text-blue-700 hover:bg-blue-50">
            Upload QRIS
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Hero;
