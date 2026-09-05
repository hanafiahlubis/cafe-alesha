"use client";

import React, { useState } from "react";
import Link from "next/link";
import SectionHeader from "@/components/Common/SectionHeader";

const Pricing = () => {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <section id="pricing" className="bg-slate-50/70 py-20 dark:bg-slate-950/40 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          headerInfo={{
            title: "PAKET HARGA",
            subtitle: "Pilihan Paket yang Fleksibel",
            description: "Tersedia paket bulanan maupun tahunan sesuai dengan skala aplikasi Anda.",
          }}
        />

        {/* Toggle Switch */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <span className={`text-sm font-medium ${!isAnnual ? "text-blue-600 font-bold" : "text-slate-500"}`}>
            Bulanan
          </span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className="relative h-7 w-14 rounded-full bg-blue-600 p-1 transition"
            aria-label="Ganti periode harga"
          >
            <div
              className={`h-5 w-5 rounded-full bg-white transition-transform ${
                isAnnual ? "translate-x-7" : "translate-x-0"
              }`}
            />
          </button>
          <span className={`text-sm font-medium ${isAnnual ? "text-blue-600 font-bold" : "text-slate-500"}`}>
            Tahunan <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-600 font-bold">Hemat 20%</span>
          </span>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Card 1 */}
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Starter</h3>
            <p className="text-xs text-slate-500 mt-1">Cocok untuk proyek awal & portofolio</p>
            <div className="mt-6 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-slate-900 dark:text-white">{isAnnual ? "Rp 99K" : "Rp 129K"}</span>
              <span className="text-xs text-slate-500">/bulan</span>
            </div>
            <ul className="mt-6 space-y-3 text-xs text-slate-600 dark:text-slate-400">
              <li>✓ Template Lengkap Next.js</li>
              <li>✓ Database .env Ready</li>
              <li>✓ Akses Komponen UI</li>
            </ul>
            <Link
              href="/auth/signup"
              className="mt-8 block text-center rounded-xl border border-slate-300 py-3 text-sm font-semibold hover:border-blue-600 hover:text-blue-600 dark:border-slate-700"
            >
              Pilih Paket
            </Link>
          </div>

          {/* Card 2 (Featured - Blue Accent) */}
          <div className="relative rounded-2xl border-2 border-blue-600 bg-white p-8 shadow-xl shadow-blue-500/10 dark:bg-slate-900">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-0.5 text-xs font-bold text-white uppercase">
              Paling Populer
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Pro SaaS</h3>
            <p className="text-xs text-slate-500 mt-1">Untuk aplikasi startup dan tim berkembang</p>
            <div className="mt-6 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-blue-600">{isAnnual ? "Rp 199K" : "Rp 249K"}</span>
              <span className="text-xs text-slate-500">/bulan</span>
            </div>
            <ul className="mt-6 space-y-3 text-xs text-slate-600 dark:text-slate-400">
              <li>✓ Semua Fitur Starter</li>
              <li>✓ Integrasi Neon PostgreSQL</li>
              <li>✓ Autentikasi Siap Pakai</li>
              <li>✓ Dukungan Prioritas</li>
            </ul>
            <Link
              href="/auth/signup"
              className="mt-8 block text-center rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 shadow-md shadow-blue-500/30"
            >
              Mulai Uji Coba Pro
            </Link>
          </div>

          {/* Card 3 */}
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Enterprise</h3>
            <p className="text-xs text-slate-500 mt-1">Skala besar dengan kebutuhan kustom</p>
            <div className="mt-6 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-slate-900 dark:text-white">{isAnnual ? "Rp 499K" : "Rp 599K"}</span>
              <span className="text-xs text-slate-500">/bulan</span>
            </div>
            <ul className="mt-6 space-y-3 text-xs text-slate-600 dark:text-slate-400">
              <li>✓ Semua Fitur Pro</li>
              <li>✓ Multi-Tenant Database</li>
              <li>✓ Custom Domain & Branding</li>
              <li>✓ Konsultasi Skema Tabel</li>
            </ul>
            <Link
              href="#contact"
              className="mt-8 block text-center rounded-xl border border-slate-300 py-3 text-sm font-semibold hover:border-blue-600 hover:text-blue-600 dark:border-slate-700"
            >
              Hubungi Sales
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
