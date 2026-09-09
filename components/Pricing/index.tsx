"use client";

import React from "react";
import SectionHeader from "@/components/Common/SectionHeader";

const Pricing = () => {
  return (
    <section id="pricing" className="py-16 bg-slate-50/70 dark:bg-slate-950/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          headerInfo={{
            title: "PAKET HARGA",
            subtitle: "Pilihan Paket Kasir POS",
            description: "Aplikasi POS Kasir Modern siap pakai.",
          }}
        />
        <div className="max-w-md mx-auto rounded-2xl border-2 border-blue-600 bg-white p-6 shadow-xl dark:bg-slate-900 text-center">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Full POS System</h3>
          <div className="mt-4 text-3xl font-black text-blue-600">Terbuka &amp; Lengkap</div>
          <p className="text-xs text-slate-500 mt-2">Next.js 15 + Neon PostgreSQL + Upload QRIS</p>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
