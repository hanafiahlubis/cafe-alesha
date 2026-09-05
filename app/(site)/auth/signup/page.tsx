"use client";

import React, { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Registrasi simulasi berhasil! Silakan periksa file .env untuk koneksi user table.");
  };

  return (
    <section className="pt-36 pb-20 lg:pt-44 lg:pb-28">
      <div className="mx-auto max-w-md px-4 sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Buat Akun Baru</h1>
            <p className="text-xs text-slate-500 mt-2">Daftar untuk mengakses template dan fitur</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                Nama Lengkap
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Ali Hanafiah"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@domain.com"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                Kata Sandi
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700"
            >
              Daftar Sekarang
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            Sudah punya akun?{" "}
            <Link href="/auth/signin" className="font-semibold text-blue-600 hover:underline">
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
