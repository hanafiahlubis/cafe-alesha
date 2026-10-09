"use client";

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { usePOS } from "@/context/POSContext";

interface SaveOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SaveOrderModal: React.FC<SaveOrderModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    cart,
    saveCurrentOrder,
    activeSavedOrderId,
    activeSavedOrderName,
  } = usePOS();

  const [orderName, setOrderName] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Otomatis isi nama pesanan jika sedang mengedit pesanan yang sudah pernah disimpan
  useEffect(() => {
    if (isOpen) {
      if (activeSavedOrderName) {
        setOrderName(activeSavedOrderName);
      } else {
        setOrderName("");
      }
    }
  }, [isOpen, activeSavedOrderName]);

  if (!isOpen) return null;

  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce(
    (sum, item) => sum + item.menuItem.price * item.quantity,
    0
  );

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);
  };

  const quickPresets = [
    "Meja 1",
    "Meja 2",
    "Meja 3",
    "Meja 4",
    "Meja 5",
    "Takeaway / Bungkus",
    "Mas Budi",
    "Ojol / GrabFood",
  ];

  const isEditingExisting = !!activeSavedOrderId && !!activeSavedOrderName;

  const handleSave = async (asNew: boolean = false) => {
    const finalName = orderName.trim() || activeSavedOrderName || "";
    if (!finalName) {
      toast.error("Silakan isi nama pesanan atau nomor meja!");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await saveCurrentOrder(finalName, asNew);
      if (result.success) {
        if (result.isUpdated) {
          toast.success(`Pesanan "${finalName}" berhasil diperbarui dengan menu tambahan!`);
        } else {
          toast.success(`Pesanan "${finalName}" berhasil disimpan!`);
        }
        setOrderName("");
        onClose();
      } else {
        toast.error(result.message || "Gagal menyimpan pesanan");
      }
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat menyimpan pesanan");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 animate-fadeIn">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-blue-100 dark:border-slate-800 transition-all">
        {/* Header Modal */}
        <div className={`p-4 text-white flex items-center justify-between ${
          isEditingExisting
            ? "bg-gradient-to-r from-blue-600 to-indigo-600"
            : "bg-gradient-to-r from-amber-500 to-orange-500"
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-lg shadow-sm">
              {isEditingExisting ? "📝" : "💾"}
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight">
                {isEditingExisting
                  ? `Perbarui Pesanan: ${activeSavedOrderName}`
                  : "Simpan Pesanan Sementara"}
              </h3>
              <p className="text-[11px] text-white/80">
                {isEditingExisting
                  ? "Menyimpan penambahan/perubahan menu ke pesanan ini"
                  : "Tahan keranjang untuk pelanggan/meja tertentu"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/20 p-1.5 text-white hover:bg-white/30 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Indikator Status Jika Sedang Mengedit Pesanan yang Sudah Ada */}
        {isEditingExisting && (
          <div className="bg-blue-50 dark:bg-blue-950/60 px-4 py-2 border-b border-blue-100 dark:border-blue-900 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-blue-600 dark:text-blue-400 font-bold">🏷️ Pesanan Aktif:</span>
              <span className="font-extrabold text-slate-800 dark:text-white">
                {activeSavedOrderName}
              </span>
            </div>
            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold bg-white dark:bg-slate-900 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
              Akan diperbarui
            </span>
          </div>
        )}

        {/* Ringkasan Keranjang */}
        <div className="p-3.5 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-600 dark:text-slate-400 font-medium">
              Isi Keranjang ({totalItemCount} item):
            </span>
            <span className="font-extrabold text-blue-600 dark:text-blue-400">
              {formatIDR(subtotal)}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1 max-h-20 overflow-y-auto">
            {cart.map((item) => (
              <span
                key={item.menuItem.id}
                className="inline-block rounded-lg bg-white dark:bg-slate-900 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
              >
                {item.quantity}x {item.menuItem.name}
              </span>
            ))}
          </div>
        </div>

        {/* Form Input Nama Pesanan */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave(false);
          }}
          className="p-4 sm:p-5 space-y-3.5"
        >
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              Nama Pesanan / Pelanggan / Nomor Meja <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                autoFocus
                value={orderName}
                onChange={(e) => setOrderName(e.target.value)}
                placeholder="Contoh: Meja 4 / Mas Budi / Bungkus"
                className="w-full rounded-xl border-2 border-blue-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <span className="absolute right-3 top-2.5 text-base">🏷️</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              {isEditingExisting
                ? `Tetap gunakan "${orderName || activeSavedOrderName}" untuk memperbarui pesanan ini.`
                : "Beri nama unik agar mudah dipanggil kembali saat pembayaran."}
            </p>
          </div>

          {/* Quick Preset Buttons (Jika membuat pesanan baru atau ingin ganti) */}
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
              PILIH CEPAT:
            </span>
            <div className="flex flex-wrap gap-1">
              {quickPresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setOrderName(preset)}
                  className={`rounded-lg px-2 py-0.5 text-[11px] font-medium transition cursor-pointer border ${
                    orderName === preset
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm font-bold"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Tombol Aksi */}
          <div className="pt-2 flex flex-col gap-2 border-t border-slate-100 dark:border-slate-800">
            {isEditingExisting ? (
              <div className="space-y-1.5">
                <button
                  type="button"
                  disabled={isSubmitting || !orderName.trim()}
                  onClick={() => handleSave(false)}
                  className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/30 transition active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin text-xs">⏳</span>
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <span>💾</span>
                      <span>Perbarui Pesanan "{orderName || activeSavedOrderName}"</span>
                    </>
                  )}
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={isSubmitting || !orderName.trim()}
                    onClick={() => handleSave(true)}
                    className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 py-2 text-[11px] font-semibold text-slate-700 dark:text-slate-300 transition cursor-pointer text-center"
                    title="Simpan sebagai pesanan baru terpisah tanpa menimpa"
                  >
                    Simpan sbg Pesanan Baru
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl px-3 py-2 text-[11px] font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isSubmitting || !orderName.trim()}
                  onClick={() => handleSave(false)}
                  className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-amber-500/30 hover:from-amber-600 hover:to-orange-600 transition active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin text-sm">⏳</span>
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <span>💾</span>
                      <span>Simpan Pesanan</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
