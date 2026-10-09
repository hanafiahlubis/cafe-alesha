"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";
import { usePOS } from "@/context/POSContext";
import { SavedOrder } from "@/types/pos";

interface SavedOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPayment?: () => void;
}

export const SavedOrdersModal: React.FC<SavedOrdersModalProps> = ({
  isOpen,
  onClose,
  onOpenPayment,
}) => {
  const {
    savedOrders,
    cart,
    loadSavedOrder,
    deleteSavedOrder,
    activeSavedOrderId,
  } = usePOS();

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [confirmLoadOrder, setConfirmLoadOrder] = useState<SavedOrder | null>(null);

  // FITUR 1: State untuk Pop-up Konfirmasi Hapus Pesanan Tersimpan
  const [orderToDelete, setOrderToDelete] = useState<SavedOrder | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  if (!isOpen) return null;

  const filteredOrders = savedOrders.filter((order) =>
    order.orderName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);
  };

  const formatDateTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const handleSelectOrder = (order: SavedOrder) => {
    if (cart.length > 0 && activeSavedOrderId !== order.id) {
      setConfirmLoadOrder(order);
    } else {
      executeLoad(order, false);
    }
  };

  const executeLoad = (order: SavedOrder, deleteAfterLoad: boolean) => {
    loadSavedOrder(order);
    if (deleteAfterLoad) {
      deleteSavedOrder(order.id);
    }
    toast.success(`Pesanan "${order.orderName}" dimuat ke keranjang! Tambahkan menu atau langsung bayar.`);
    setConfirmLoadOrder(null);
    onClose();
  };

  // FITUR 1: Konfirmasi hapus pesanan dengan auto-close jika pesanan terakhir
  const handleConfirmDelete = async () => {
    if (!orderToDelete) return;

    setIsDeleting(true);
    const targetId = orderToDelete.id;
    const targetName = orderToDelete.orderName;
    const isLastOrder = savedOrders.length <= 1;

    try {
      await deleteSavedOrder(targetId);
      setOrderToDelete(null);

      // Jika simpan pesanan sudah habis / tidak ada lagi, otomatis tutup modal
      if (isLastOrder) {
        toast.success(`Pesanan "${targetName}" dihapus. Daftar pesanan tersimpan kini kosong.`);
        onClose();
      } else {
        toast.success(`Pesanan "${targetName}" berhasil dihapus.`);
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus pesanan");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 animate-fadeIn">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-blue-100 dark:border-slate-800 flex flex-col transition-all">
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-lg shadow-sm">
              📋
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base leading-tight">
                  Daftar Pesanan Tersimpan
                </h3>
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-black">
                  {savedOrders.length} Pesanan
                </span>
              </div>
              <p className="text-[11px] text-blue-100">
                Pilih pesanan untuk menambah menu atau konfirmasi pembayaran
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

        {/* Search Bar */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-b border-blue-50 dark:border-slate-800 shrink-0">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan nama pesanan (contoh: Meja 4, Budi)..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 pl-9 text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
            />
            <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Content Body: List Orders */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
          {savedOrders.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 dark:bg-slate-800 text-3xl mb-3 shadow-inner">
                📝
              </div>
              <h4 className="text-sm sm:text-base font-extrabold text-slate-800 dark:text-slate-100">
                Belum Ada Pesanan Tersimpan
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                Ketika ada pelanggan yang belum siap bayar, klik tombol{" "}
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  "Simpan Pesanan"
                </span>{" "}
                di kasir untuk menyimpan keranjangnya sementara.
              </p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Tidak ada pesanan tersimpan yang cocok dengan pencarian "{searchQuery}".
            </div>
          ) : (
            filteredOrders.map((order) => {
              const totalItems = order.items.reduce(
                (sum, item) => sum + item.quantity,
                0
              );
              const isCurrentlyActive = activeSavedOrderId === order.id;

              return (
                <div
                  key={order.id}
                  className={`rounded-2xl border p-3.5 sm:p-4 shadow-sm transition ${
                    isCurrentlyActive
                      ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-blue-500/20"
                      : "border-blue-100 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className={`flex h-8 w-8 items-center justify-center rounded-xl font-bold text-xs sm:text-sm ${
                        isCurrentlyActive
                          ? "bg-blue-600 text-white"
                          : "bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400"
                      }`}>
                        🏷️
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
                            {order.orderName}
                          </h4>
                          {isCurrentlyActive && (
                            <span className="rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 text-[10px] font-bold border border-emerald-300 dark:border-emerald-800">
                              🟢 Sedang Aktif
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          📅 {formatDateTime(order.updatedAt || order.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="text-left sm:text-right flex items-baseline sm:block justify-between">
                      <span className="text-[10px] text-slate-400 uppercase font-bold sm:block mr-2 sm:mr-0">
                        Total Pesanan:
                      </span>
                      <span className="text-sm sm:text-base font-black text-blue-600 dark:text-blue-400">
                        {formatIDR(order.totalPrice)}
                      </span>
                    </div>
                  </div>

                  {/* List Item Singkat */}
                  <div className="py-2.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                      <span>Rincian Menu ({totalItems} item):</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                      {order.items.map((item, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 rounded-lg bg-sky-50 dark:bg-slate-900 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:text-slate-300 border border-blue-100/80 dark:border-slate-800"
                        >
                          <strong className="text-blue-600 dark:text-blue-400">
                            {item.quantity}x
                          </strong>{" "}
                          {item.menuItem?.name || "Menu"}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-700/60">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOrderToDelete(order);
                      }}
                      className="rounded-xl border border-rose-200 dark:border-rose-900/60 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer flex items-center gap-1 active:scale-95"
                    >
                      <span>🗑️</span>
                      <span>Hapus</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectOrder(order)}
                      className={`rounded-xl px-4 py-1.5 text-xs font-bold text-white shadow-md transition active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                        isCurrentlyActive
                          ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                          : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20"
                      }`}
                    >
                      <span>🛒</span>
                      <span>{isCurrentlyActive ? "Buka di Kasir" : "Muat ke Keranjang"}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* MODAL POP-UP KONFIRMASI HAPUS PESANAN TERSIMPAN */}
        {orderToDelete && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/70 p-3 sm:p-4 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-5 shadow-2xl border border-rose-200 dark:border-rose-900/60 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 text-xl shadow-inner">
                  🗑️
                </div>
                <div>
                  <h4 className="font-black text-base text-slate-900 dark:text-white leading-tight">
                    Hapus Pesanan Tersimpan?
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Data pesanan ini akan dihapus permanen.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-3 border border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Nama Pesanan:</span>
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    {orderToDelete.orderName}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Total Harga:</span>
                  <span className="font-black text-blue-600 dark:text-blue-400">
                    {formatIDR(orderToDelete.totalPrice)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500 font-medium">Jumlah Item:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {orderToDelete.items.reduce((s, i) => s + i.quantity, 0)} pcs
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setOrderToDelete(null)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="w-full rounded-xl bg-rose-600 hover:bg-rose-700 py-2.5 text-xs font-bold text-white shadow-md shadow-rose-600/30 transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isDeleting ? "Menghapus..." : "Ya, Hapus"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Konfirmasi Timpa Keranjang jika keranjang aktif ada item */}
        {confirmLoadOrder && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/70 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 p-4 shadow-2xl border border-amber-200 dark:border-amber-900 space-y-3">
              <div className="flex items-center gap-2 text-amber-600">
                <span className="text-xl">⚠️</span>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Keranjang Tidak Kosong
                </h4>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Keranjang saat ini masih berisi {cart.reduce((s, i) => s + i.quantity, 0)} item.
                Apakah Anda ingin mengganti isi keranjang dengan pesanan{" "}
                <strong>"{confirmLoadOrder.orderName}"</strong>?
              </p>
              <div className="pt-2 flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => executeLoad(confirmLoadOrder, false)}
                  className="w-full rounded-xl bg-blue-600 py-2 text-xs font-bold text-white hover:bg-blue-700 transition cursor-pointer"
                >
                  Ya, Ganti Isi Keranjang
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmLoadOrder(null)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-blue-50 dark:border-slate-800 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
