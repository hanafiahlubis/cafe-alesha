"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <section className="pt-40 pb-24 text-center">
      <div className="mx-auto max-w-lg px-4">
        <Image
          src="/images/shape/404.svg"
          alt="404 Halaman Tidak Ditemukan"
          width={350}
          height={140}
          className="mx-auto mb-8"
        />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Halaman Tidak Ditemukan</h1>
        <p className="text-sm text-slate-500 mt-2 mb-6">
          Maaf, tautan yang Anda tuju tidak tersedia atau telah dipindahkan.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue-700"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </section>
  );
}
