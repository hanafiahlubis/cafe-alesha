"use client";

import React, { useState, useRef } from "react";
import toast from "react-hot-toast";
import { usePOS } from "@/context/POSContext";

export const QrisSettings: React.FC = () => {
  const { qrisImage, isCustomQris, storeInfo, updateQrisImage, resetQrisImage, updateStoreInfo } = usePOS();

  const [name, setName] = useState(storeInfo.name);
  const [address, setAddress] = useState(storeInfo.address);
  const [phone, setPhone] = useState(storeInfo.phone);
  const [qrisNmid, setQrisNmid] = useState(storeInfo.qrisNmid);
  const [qrisMerchantName, setQrisMerchantName] = useState(storeInfo.qrisMerchantName);

  const [previewImage, setPreviewImage] = useState<string>(qrisImage);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 3MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setPreviewImage(base64);
      toast.success("Foto QRIS dipilih! Klik 'Simpan ke Database' untuk menerapkan.");
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (previewImage !== qrisImage) {
        const uploadRes = await fetch("/api/upload-qris", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            qrisImage: previewImage,
            name,
            address,
            phone,
            qrisNmid,
            qrisMerchantName,
          }),
        });

        if (!uploadRes.ok) throw new Error("Gagal mengunggah QRIS ke server");
        updateQrisImage(previewImage);
      } else {
        const settingsRes = await fetch("/api/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            address,
            phone,
            qrisNmid,
            qrisMerchantName,
            qrisImage: previewImage,
          }),
        });

        if (!settingsRes.ok) throw new Error("Gagal menyimpan data toko ke server");
      }

      updateStoreInfo({
        name,
        address,
        phone,
        qrisNmid,
        qrisMerchantName,
      });

      toast.success("Pengaturan & QRIS berhasil disimpan ke NeonDB!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Terjadi kesalahan saat menyimpan data");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetQris = async () => {
    if (!confirm("Kembalikan ke QRIS BCA standar bawaan?")) return;
    setIsUploading(true);

    try {
      await fetch("/api/upload-qris", { method: "DELETE" });
      resetQrisImage();
      setPreviewImage("/images/qris/qris-bca.svg");
      toast.success("QRIS dikembalikan ke template BCA standar");
    } catch (err) {
      toast.error("Gagal mereset QRIS");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F7FF] dark:bg-slate-950 pt-2 sm:pt-20 pb-16 text-slate-900 dark:text-slate-50 transition-colors duration-200">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 space-y-4">
        {/* Header Banner */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 p-4 shadow-sm border border-blue-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚡</span>
              <h1 className="text-base sm:text-xl font-black text-slate-900 dark:text-white">
                Upload QRIS &amp; Pengaturan Toko
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Atur gambar QRIS toko Anda, data identitas struk kasir, dan sinkronisasi ke NeonDB.
            </p>
          </div>
          {/* Status NeonDB Badge */}
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>NeonDB PostgreSQL Terhubung</span>
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Kolom Kiri: Form Input */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-4">
            {/* Card 1: Upload QRIS Image */}
            <div className="rounded-2xl bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-sm border border-blue-100 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-blue-50 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📷</span>
                  <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                    Foto QRIS Pembayaran Toko
                  </h2>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    isCustomQris
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                  }`}
                >
                  {isCustomQris ? "QRIS Toko Sendiri" : "QRIS BCA Bawaan"}
                </span>
              </div>

              {/* Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-blue-200 dark:border-slate-700 bg-sky-50/40 dark:bg-slate-800/40 p-6 text-center cursor-pointer hover:border-blue-500 hover:bg-sky-50 transition"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png, image/jpeg, image/webp, image/svg+xml"
                  className="hidden"
                />
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <h4 className="mt-3 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                  Klik untuk Memilih File QRIS
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Format PNG, JPG, atau WEBP (Maksimal 3MB)
                </p>
              </div>

              {isCustomQris && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleResetQris}
                    disabled={isUploading}
                    className="text-xs font-semibold text-rose-500 hover:text-rose-600 hover:underline cursor-pointer"
                  >
                    Kembalikan ke QRIS BCA Bawaan
                  </button>
                </div>
              )}
            </div>

            {/* Card 2: Pengaturan Toko & Identitas Struk */}
            <div className="rounded-2xl bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-sm border border-blue-100 dark:border-slate-800">
              <div className="flex items-center gap-2 border-b border-blue-50 dark:border-slate-800 pb-3 mb-4">
                <span className="text-lg">🏪</span>
                <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                  Identitas Toko &amp; NMID QRIS (Tercetak di Struk)
                </h2>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Nama Toko / Cafe *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-blue-200 dark:border-slate-700 bg-sky-50/30 dark:bg-slate-800 px-3.5 py-2 text-xs sm:text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Alamat Lengkap Toko
                  </label>
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full rounded-xl border border-blue-200 dark:border-slate-700 bg-sky-50/30 dark:bg-slate-800 px-3.5 py-2 text-xs sm:text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      No. WhatsApp / Telepon
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-xl border border-blue-200 dark:border-slate-700 bg-sky-50/30 dark:bg-slate-800 px-3.5 py-2 text-xs sm:text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      NMID Merchant QRIS
                    </label>
                    <input
                      type="text"
                      value={qrisNmid}
                      onChange={(e) => setQrisNmid(e.target.value)}
                      className="w-full rounded-xl border border-blue-200 dark:border-slate-700 bg-sky-50/30 dark:bg-slate-800 px-3.5 py-2 text-xs sm:text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Nama Merchant di QRIS
                  </label>
                  <input
                    type="text"
                    value={qrisMerchantName}
                    onChange={(e) => setQrisMerchantName(e.target.value)}
                    className="w-full rounded-xl border border-blue-200 dark:border-slate-700 bg-sky-50/30 dark:bg-slate-800 px-3.5 py-2 text-xs sm:text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="rounded-xl bg-blue-600 px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition cursor-pointer flex items-center gap-2 active:scale-95"
                  >
                    {isSaving ? (
                      <>
                        <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                        Menyimpan ke NeonDB...
                      </>
                    ) : (
                      "Simpan ke Database"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Kolom Kanan: Live Preview */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-4">
            {/* Live Preview QRIS Kasir */}
            <div className="rounded-2xl bg-white dark:bg-slate-900 p-4 shadow-sm border border-blue-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5 mb-3">
                <span className="text-base">📱</span>
                <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                  Pratinjau QRIS di Layar Kasir
                </h3>
              </div>

              <div className="rounded-2xl border-2 border-blue-200 dark:border-slate-700 p-3 bg-sky-50/40 dark:bg-slate-800/60 text-center">
                <div className="flex items-center justify-between border-b border-blue-100 dark:border-slate-700 pb-1 mb-2">
                  <span className="text-[10px] font-black text-rose-600">QRIS</span>
                  <span className="text-[10px] font-black text-blue-700 dark:text-blue-400">
                    {isCustomQris ? "TOKO" : "BCA"}
                  </span>
                </div>

                <div className="mx-auto w-44 h-44 bg-white p-2 rounded-xl shadow-sm flex items-center justify-center overflow-hidden border border-blue-100">
                  <img
                    src={previewImage}
                    alt="Pratinjau QRIS"
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="mt-2 text-center">
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                    {name}
                  </h4>
                  <p className="text-[10px] text-slate-500 font-mono">NMID: {qrisNmid}</p>
                </div>
              </div>
            </div>

            {/* Live Preview Struk Thermal Kasir */}
            <div className="rounded-2xl bg-white dark:bg-slate-900 p-4 shadow-sm border border-blue-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-base">🧾</span>
                <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                  Pratinjau Kepala Struk Kasir
                </h3>
              </div>
              <div className="font-mono text-[10px] bg-slate-50 p-3 rounded-xl border border-dashed border-slate-300 text-slate-800 space-y-0.5 text-center">
                <p className="font-black text-xs uppercase">{name}</p>
                <p className="text-slate-500">{address}</p>
                <p className="text-slate-500">Telp: {phone}</p>
                <div className="border-b border-dashed border-slate-400 my-1"></div>
                <div className="py-1 bg-blue-50 text-blue-900 font-bold rounded">
                  ANTREAN #01
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
