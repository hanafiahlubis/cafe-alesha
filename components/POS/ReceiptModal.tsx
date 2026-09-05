"use client";

import React from "react";
import { usePOS } from "@/context/POSContext";
import { Transaction } from "@/types/pos";

interface ReceiptModalProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  transaction,
  onClose,
}) => {
  const { storeInfo } = usePOS();

  if (!transaction) return null;

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleManualPrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-2 sm:p-4 backdrop-blur-sm animate-fadeIn print:p-0 print:bg-white overflow-y-auto">
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-3.5 sm:p-5 shadow-2xl border border-slate-200 text-slate-800 my-auto print:shadow-none print:border-none print:max-w-none print:w-full">
        {/* Success Header Badge */}
        <div className="print:hidden text-center mb-2.5 sm:mb-4">
          <div className="mx-auto flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-xl sm:text-2xl shadow-sm mb-1.5">
            ✓
          </div>
          <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
            Pembayaran Berhasil!
          </h3>
          <p className="text-[10px] sm:text-xs text-slate-500">
            Pesanan telah tercatat ke antrean kasir
          </p>
        </div>

        {/* Paper Receipt Card Container */}
        <div
          id="receipt-print-area"
          className="font-mono text-[11px] sm:text-xs text-slate-800 bg-slate-50/60 p-3 sm:p-4 rounded-xl border border-dashed border-slate-300 print:bg-white print:p-0 print:border-none"
        >
          <div className="text-center space-y-0.5">
            <h2 className="text-sm sm:text-base font-black tracking-wider uppercase text-slate-900 truncate">
              {storeInfo.name}
            </h2>
            <p className="text-[9px] sm:text-[10px] text-slate-600 line-clamp-1">
              {storeInfo.address}
            </p>
            <p className="text-[9px] sm:text-[10px] text-slate-600">Telp: {storeInfo.phone}</p>
            <div className="border-b border-dashed border-slate-400 my-1.5"></div>

            {/* Nomor Antrean Otomatis Besar */}
            <div className="py-2 bg-blue-50/90 rounded-xl border border-blue-200 my-1">
              <span className="text-[9px] sm:text-[10px] uppercase font-bold text-blue-800 block">
                NOMOR ANTREAN
              </span>
              <div className="text-2xl sm:text-3xl font-black text-blue-900 tracking-wider my-0.5">
                {transaction.queueNumber}
              </div>
              <span className="text-[8px] sm:text-[9px] text-blue-700 font-semibold block">
                (Tanpa Nomor Meja - Silakan Menunggu)
              </span>
            </div>

            <div className="border-b border-dashed border-slate-400 my-1.5"></div>
            <div className="flex justify-between text-[9px] sm:text-[10px] text-slate-600">
              <span>No: {transaction.id}</span>
              <span>{formatDate(transaction.timestamp)}</span>
            </div>
            <div className="flex justify-between text-[9px] sm:text-[10px] text-slate-600">
              <span>Kasir: Utama</span>
              <span>Metode: {transaction.paymentMethod}</span>
            </div>
            <div className="border-b border-dashed border-slate-400 my-1.5"></div>
          </div>

          {/* Items Table */}
          <div className="my-2 space-y-1">
            {transaction.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start text-[11px] sm:text-xs gap-1">
                <div className="min-w-0 flex-1">
                  <p className="font-bold leading-tight text-slate-900 truncate">{item.menuItem.name}</p>
                  <p className="text-[9px] sm:text-[10px] text-slate-500">
                    {item.quantity} x {formatIDR(item.menuItem.price)}
                  </p>
                </div>
                <span className="font-semibold text-right shrink-0">
                  {formatIDR(item.menuItem.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t border-dashed border-slate-400 pt-1.5 space-y-0.5">
            <div className="flex justify-between text-[11px] sm:text-xs font-medium">
              <span>Subtotal:</span>
              <span>{formatIDR(transaction.subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm font-extrabold border-t border-slate-800 pt-1 mt-1 text-slate-900">
              <span>TOTAL:</span>
              <span>{formatIDR(transaction.total)}</span>
            </div>
            {transaction.paymentMethod === "Cash" ? (
              <>
                <div className="flex justify-between text-[10px] sm:text-xs font-medium pt-0.5">
                  <span>Tunai Diterima:</span>
                  <span>{formatIDR(transaction.cashReceived || transaction.total)}</span>
                </div>
                <div className="flex justify-between text-[10px] sm:text-xs font-bold text-emerald-700">
                  <span>Kembalian:</span>
                  <span>{formatIDR(transaction.changeAmount || 0)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between text-[10px] sm:text-xs font-bold text-blue-700 pt-0.5">
                <span>Pembayaran QRIS:</span>
                <span>LUNAS</span>
              </div>
            )}
          </div>

          {/* Receipt Footer */}
          <div className="border-t border-dashed border-slate-400 my-2"></div>
          <div className="text-center space-y-0.5 text-[9px] sm:text-[10px] text-slate-600">
            <p className="font-bold">TERIMA KASIH ATAS KUNJUNGAN ANDA</p>
            <p className="font-bold text-blue-700">
              Ambil pesanan #{transaction.queueNumber.replace('#','')}
            </p>
          </div>
        </div>

        {/* Modal Action buttons */}
        <div className="mt-3.5 space-y-2 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-blue-600 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-blue-700 transition shadow-lg shadow-blue-500/25 active:scale-98 cursor-pointer"
          >
            Selesai &amp; Transaksi Baru
          </button>
          <button
            type="button"
            onClick={handleManualPrint}
            className="w-full rounded-xl border border-slate-300 py-2 text-[11px] sm:text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>🖨️</span> Cetak Struk (Opsional)
          </button>
        </div>
      </div>
    </div>
  );
};
