"use client";

import React, { useState } from "react";
import SectionHeader from "@/components/Common/SectionHeader";
import toast from "react-hot-toast";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Pesan berhasil dikirim! Kami akan segera menghubungi Anda.");
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <section id="contact" className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          headerInfo={{
            title: "HUBUNGI KAMI",
            subtitle: "Ada Pertanyaan atau Mau Diskusi Skema Tabel?",
            description: "Kirimkan pesan kepada kami untuk berdiskusi lebih lanjut mengenai arsitektur database, tabel, atau kustomisasi fitur.",
          }}
        />

        <div className="max-w-2xl mx-auto rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-2">
                Nama Lengkap
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Contoh: Ali Hanafiah"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-2">
                Alamat Email
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@domain.com"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-2">
                Subjek
              </label>
              <input
                type="text"
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Diskusi Skema Database & Fitur"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-2">
                Pesan
              </label>
              <textarea
                rows={4}
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Tuliskan pesan atau kebutuhan khusus aplikasi Anda di sini..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700 active:scale-95"
            >
              Kirim Pesan
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Contact;
