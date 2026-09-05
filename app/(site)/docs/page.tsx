"use client";

import React from "react";
import Link from "next/link";

export default function DocsPage() {
  return (
    <section className="pt-36 pb-20 lg:pt-44 lg:pb-28">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-4">Dokumentasi Template</h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mb-8">
          Panduan ringkas instalasi dan integrasi proyek Next.js Solid Blue Edition.
        </p>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">1. Ekstraksi File ZIP</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
              Setelah mengunduh file ZIP dari Google Drive, ekstrak file ke direktori kerja komputer lokal Anda.
            </p>
            <div className="rounded-lg bg-slate-950 p-3 font-mono text-xs text-emerald-400">
              unzip solid-nextjs-blue.zip<br/>
              cd solid-nextjs-blue
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">2. Instalasi Dependensi</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
              Jalankan perintah berikut untuk menginstal seluruh pustaka yang dibutuhkan:
            </p>
            <div className="rounded-lg bg-slate-950 p-3 font-mono text-xs text-emerald-400">
              npm install --legacy-peer-deps
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">3. Konfigurasi Database .env</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
              Buka file <code>.env</code> dan sesuaikan <code>DATABASE_URL</code> dengan database Neon.tech atau PostgreSQL Anda.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">4. Menjalankan Server Lokal</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
              Mulai development server dengan perintah:
            </p>
            <div className="rounded-lg bg-slate-950 p-3 font-mono text-xs text-emerald-400">
              npm run dev
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
