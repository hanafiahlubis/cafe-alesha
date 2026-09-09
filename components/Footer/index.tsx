"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="border-t border-blue-100 bg-white pt-8 pb-24 lg:pb-10 dark:border-slate-800 dark:bg-slate-950 transition-colors duration-200">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="md:col-span-2">
            <Link href="/" className="inline-block mb-2">
              <Image
                src="/images/logo/alesha-white.jpeg"
                alt="Logo Kasir POS"
                width={120}
                height={30}
                className="dark:hidden w-28 h-auto"
              />
              <Image
                src="/images/logo/alesha-dark.jpeg"
                alt="Logo Kasir POS Dark"
                width={120}
                height={30}
                className="hidden dark:block w-28 h-auto"
              />
            </Link>
            <p className="text-[11px] text-slate-500 max-w-sm leading-relaxed">
              Aplikasi Kasir (POS) modern berbasis Next.js 15 &amp; NeonDB PostgreSQL, responsive untuk layar smartphone hingga 320px, antrean otomatis, pembayaran Cash &amp; QRIS BCA, dan rekap keuangan.
            </p>
          </div>

          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-2">
              Menu Kasir POS
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              <li><Link href="/" className="hover:text-blue-600">Layar Kasir (POS)</Link></li>
              <li><Link href="/kelola-menu" className="hover:text-blue-600">Kelola Menu &amp; Harga</Link></li>
              <li><Link href="/riwayat" className="hover:text-blue-600">Riwayat Penjualan</Link></li>
              <li><Link href="/upload-qris" className="hover:text-blue-600">Upload QRIS Toko</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-2">
              Fitur &amp; Database
            </h4>
            <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
              <li>⚡ Neon PostgreSQL Ready</li>
              <li>📱 Mendukung Layar 320px+</li>
              <li>🎨 Tema Biru Muda &amp; Putih</li>
              <li>🧾 Struk Thermal Pop-up Modal</li>
              <li>🔒 API Endpoints Terstruktur</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-blue-50 dark:border-slate-800 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400 text-center sm:text-left">
          <p>© {new Date().getFullYear()} Kasir POS Modern. Terintegrasi NeonDB.</p>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-blue-600">Kasir</Link>
            <Link href="/riwayat" className="hover:text-blue-600">Laporan Penjualan</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
