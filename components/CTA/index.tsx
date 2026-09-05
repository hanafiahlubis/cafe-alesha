"use client";

import React from "react";
import Link from "next/link";

const CTA = () => {
  return (
    <section className="py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 px-6 py-16 sm:px-12 lg:px-16 text-center text-white shadow-2xl">
          <h2 className="text-3xl font-extrabold sm:text-4xl max-w-2xl mx-auto">
            Mulai Kembangkan Aplikasi Next.js Anda Hari Ini
          </h2>
          <p className="mt-4 text-base text-blue-100 max-w-xl mx-auto leading-relaxed">
            Template ini siap diunduh dalam bentuk file ZIP. Cukup ekstrak, sesuaikan database di file <code>.env</code>, dan Anda siap meluncurkan aplikasi Anda.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/auth/signup"
              className="rounded-xl bg-white px-7 py-3.5 text-base font-semibold text-blue-700 shadow-md transition hover:bg-blue-50 active:scale-95"
            >
              Daftar Akun Sekarang
            </Link>
            <Link
              href="#contact"
              className="rounded-xl border border-white/30 bg-white/10 px-7 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 active:scale-95"
            >
              Hubungi Kami
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
