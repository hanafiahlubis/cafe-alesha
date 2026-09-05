"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function BlogSinglePage() {
  const params = useParams();
  const slug = params?.slug as string;

  return (
    <section className="pt-36 pb-20 lg:pt-44 lg:pb-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-blue-600 font-semibold mb-6 hover:underline">
          ← Kembali ke Semua Artikel
        </Link>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-4">
          Panduan Lengkap Arsitektur Next.js & Database Serverless
        </h1>
        <div className="flex items-center gap-4 text-xs text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-4 mb-8">
          <span>Oleh Tim Pengembang</span>
          <span>•</span>
          <span>05 September 2026</span>
          <span>•</span>
          <span className="text-blue-600 dark:text-blue-400 font-semibold">Tag: {slug || "Next.js"}</span>
        </div>

        <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 text-sm leading-relaxed space-y-4">
          <p>
            Dalam pengembangan aplikasi berbasis Next.js, salah satu langkah paling awal yang krusial adalah mempersiapkan lingkungan konfigurasi database yang aman dan modular.
          </p>
          <p>
            Dengan memisahkan connection string ke dalam file <code>.env</code>, Anda dapat dengan mudah beralih dari database pengembangan lokal ke layanan cloud PostgreSQL seperti <strong>Neon.tech</strong> atau Supabase tanpa mengubah baris kode aplikasi Anda.
          </p>
          <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-900/40 dark:bg-blue-950/40 font-mono text-xs">
            DATABASE_URL=&quot;postgresql://[user]:[password]@[endpoint].neon.tech/[dbname]&quot;
          </div>
          <p>
            Ketika Anda siap untuk menentukan relasi tabel, Anda cukup menginstal ORM favorit seperti Prisma atau Drizzle dan melakukan <code>db push</code> untuk menerapkan skema tabel baru.
          </p>
        </div>
      </div>
    </section>
  );
}
