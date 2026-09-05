"use client";

import React from "react";
import Link from "next/link";

const About = () => {
  return (
    <section id="about" className="py-20 lg:py-28 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Content */}
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-4">
              TENTANG TEMPLATE INI
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl leading-tight mb-6">
              Satu Fondasi Lengkap untuk Seluruh Kebutuhan Web Anda
            </h2>
            <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              Didesain khusus untuk memenuhi kebutuhan Ali Hanafiah & tim dalam membangun website modern berkecepatan tinggi dengan nuansa biru yang menawan.
            </p>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white text-xs">
                  ✓
                </div>
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  <strong>Arsitektur App Router:</strong> Struktur modular berbasis folder terbaru dari Next.js.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white text-xs">
                  ✓
                </div>
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  <strong>Database Terpusat:</strong> Parameter PostgreSQL/Neon.tech langsung diatur via <code>.env</code>.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white text-xs">
                  ✓
                </div>
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  <strong>Branding Biru Sesuai Permintaan:</strong> Terintegrasi dari header, tombol aksi, hingga footer.
                </span>
              </li>
            </ul>

            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700"
            >
              Mulai Eksplorasi
            </Link>
          </div>

          {/* Right: Graphic Box */}
          <div className="rounded-3xl border border-blue-200/60 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent p-8 dark:border-blue-900/40">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl">
                  B
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Blue Accent System</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Harmonisasi palet warna modern</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="h-3 w-full rounded-full bg-blue-600" />
                <div className="h-3 w-4/5 rounded-full bg-blue-400" />
                <div className="h-3 w-2/3 rounded-full bg-blue-200 dark:bg-blue-800" />
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500">
                <span>Versi: Next.js 15+</span>
                <span className="text-blue-600 dark:text-blue-400 font-semibold">Siap Diunduh (ZIP)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
