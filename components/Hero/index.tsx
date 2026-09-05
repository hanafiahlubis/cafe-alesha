"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

const Hero = () => {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28 lg:pt-44">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/15 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          {/* Left Column: Heading & CTA */}
          <div className="w-full lg:w-1/2 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/70 px-4 py-1.5 text-xs font-semibold text-blue-700 shadow-sm dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300 mb-6">
              <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
              Next.js 15 Starter Kit • Edisi Warna Biru
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl md:text-6xl dark:text-white leading-[1.15]">
              Bangun Aplikasi SaaS Impian Anda Lebih Cepat dengan{" "}
              <span className="text-gradient-blue">Tema Biru Modern</span>
            </h1>

            <p className="mt-6 text-lg text-slate-600 dark:text-slate-300 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Template Next.js Solid yang telah dioptimalkan dengan konfigurasi database PostgreSQL/Neon langsung di <code>.env</code>, komponen UI lengkap, dan sistem responsif serbaguna.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-4">
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-500/25 transition duration-200 hover:bg-blue-700 hover:shadow-blue-600/35 active:scale-95"
              >
                Mulai Sekarang Gratis
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-base font-semibold text-slate-700 shadow-sm transition duration-200 hover:bg-slate-50 hover:text-blue-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Lihat Semua Fitur
              </Link>
            </div>

            {/* Quick Stat Highlights */}
            <div className="mt-10 grid grid-cols-3 gap-4 border-t border-slate-200 pt-6 dark:border-slate-800 text-left">
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">100%</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">TypeScript Ready</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">Neon/PG</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Database .env</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">Dark Mode</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Otomatis Aktif</div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Mockup Card */}
          <div className="w-full lg:w-1/2 flex justify-center relative">
            <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-2xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-400" />
                  <div className="h-3 w-3 rounded-full bg-amber-400" />
                  <div className="h-3 w-3 rounded-full bg-emerald-400" />
                </div>
                <span className="text-xs font-mono text-slate-400">.env Database Ready</span>
              </div>

              {/* Mockup Code Preview */}
              <div className="mt-4 rounded-xl bg-slate-950 p-4 font-mono text-xs text-slate-200 leading-relaxed shadow-inner">
                <div className="text-slate-500">// Konfigurasi Database PostgreSQL di .env</div>
                <div className="mt-2 text-blue-400">DATABASE_URL=<span className="text-emerald-400">&quot;postgresql://neon...&quot;</span></div>
                <div className="text-blue-400">NEXT_PUBLIC_THEME=<span className="text-emerald-400">&quot;blue&quot;</span></div>
                <div className="text-blue-400">NEXTAUTH_SECRET=<span className="text-emerald-400">&quot;secret_key_...&quot;</span></div>
                <div className="mt-4 text-slate-500">// Status Koneksi</div>
                <div className="text-emerald-400">✓ Connected to Neon Serverless DB</div>
                <div className="text-sky-400">✓ Tailwind Blue Palette Initialized</div>
                <div className="text-slate-300">✓ Next.js App Router Standby</div>
              </div>

              {/* Decorative Blue Accents */}
              <div className="mt-6 flex items-center justify-between rounded-xl bg-blue-50 p-4 dark:bg-blue-950/40">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white font-bold">
                    S
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">Solid Template</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Siap dideploy ke Vercel / Netlify</div>
                  </div>
                </div>
                <span className="rounded-full bg-blue-600/10 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                  Aktif
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
