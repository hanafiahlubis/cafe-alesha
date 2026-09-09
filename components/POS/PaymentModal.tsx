"use client";

import React, { useState } from "react";
import { usePOS } from "@/context/POSContext";
import { PaymentMethod } from "@/types/pos";

interface PaymentModalProps {
  isOpen: boolean;
  totalAmount: number;
  queueNumber: string;
  itemCount: number;
  onClose: () => void;
  onSuccess: (method: PaymentMethod, cashReceived?: number) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  totalAmount,
  queueNumber,
  itemCount,
  onClose,
  onSuccess,
}) => {
  const { qrisImage, storeInfo, isCustomQris } = usePOS();
  const [method, setMethod] = useState<PaymentMethod>("Cash");
  const [cashInput, setCashInput] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  if (!isOpen) return null;

  const numericCash = parseInt(cashInput.replace(/\D/g, ""), 10) || 0;
  const change = Math.max(0, numericCash - totalAmount);
  const isCashSufficient = numericCash >= totalAmount;

  const quickAmounts = [
    totalAmount,
    Math.ceil(totalAmount / 10000) * 10000,
    Math.ceil(totalAmount / 20000) * 20000,
    50000,
    100000,
  ].filter((v, i, a) => v >= totalAmount && a.indexOf(v) === i);

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);
  };

  const handleCashChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, "");
    setCashInput(rawVal ? parseInt(rawVal, 10).toLocaleString("id-ID") : "");
  };

  const handleQuickCash = (val: number) => {
    setCashInput(val.toLocaleString("id-ID"));
  };

  const handlePayCash = () => {
    if (!isCashSufficient) return;
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onSuccess("Cash", numericCash);
    }, 300);
  };

  const handlePayQRIS = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onSuccess("QRIS");
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-2 sm:p-4 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 p-3.5 sm:p-6 shadow-2xl border border-blue-100 dark:border-slate-800 text-slate-800 dark:text-white">
        <div className="flex items-center justify-between border-b border-blue-100 dark:border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20">
              {queueNumber}
            </div>
            <div>
              <h3 className="text-sm sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                Pembayaran Kasir
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                {itemCount} item • Antrean {queueNumber}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mt-3 rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 p-3 sm:p-4 text-white shadow-lg shadow-blue-600/20 text-center">
          <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-blue-100 block">
            Total Tagihan
          </span>
          <div className="text-xl sm:text-3xl font-black tracking-tight mt-0.5">
            {formatIDR(totalAmount)}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-1.5 rounded-xl bg-blue-50/70 dark:bg-slate-800 p-1 border border-blue-100 dark:border-transparent">
          <button
            type="button"
            onClick={() => setMethod("Cash")}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs sm:text-sm font-bold transition cursor-pointer ${
              method === "Cash"
                ? "bg-white dark:bg-blue-600 text-blue-700 dark:text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <span>💵</span> Tunai (Cash)
          </button>
          <button
            type="button"
            onClick={() => setMethod("QRIS")}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs sm:text-sm font-bold transition cursor-pointer ${
              method === "QRIS"
                ? "bg-white dark:bg-blue-600 text-blue-700 dark:text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <span>📱</span> QRIS {isCustomQris ? "Toko" : "BCA"}
          </button>
        </div>

        {method === "Cash" && (
          <div className="mt-3 space-y-2.5 sm:space-y-3.5">
            <div>
              <label className="block text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Input Uang Diterima (Rp)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm sm:text-base">
                  Rp
                </span>
                <input
                  type="text"
                  value={cashInput}
                  onChange={handleCashChange}
                  placeholder="0"
                  autoFocus
                  className="w-full rounded-xl border border-blue-200 dark:border-slate-700 bg-sky-50/30 dark:bg-slate-800 pl-9 sm:pl-11 pr-3 py-2 sm:py-2.5 text-base sm:text-lg font-black text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-inner"
                />
              </div>
            </div>

            <div>
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                Nominal Cepat:
              </span>
              <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-1 sm:gap-1.5">
                {quickAmounts.map((amt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleQuickCash(amt)}
                    className="rounded-lg border border-blue-200 bg-blue-50/80 dark:border-slate-700 dark:bg-slate-800/80 px-1.5 py-1.5 text-[10px] sm:text-xs font-bold text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-slate-700 transition cursor-pointer active:scale-95 text-center truncate"
                  >
                    {amt === totalAmount ? "Uang Pas" : formatIDR(amt)}
                  </button>
                ))}
              </div>
            </div>

            <div className={`rounded-xl p-2.5 sm:p-3.5 border transition ${
              isCashSufficient
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                : "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200"
            }`}>
              <div className="flex justify-between items-center text-[10px] sm:text-xs font-semibold">
                <span>Status:</span>
                <span>
                  {isCashSufficient ? "✓ Uang Pas / Cukup" : "⚠ Uang Kurang"}
                </span>
              </div>
              <div className="flex justify-between items-baseline mt-0.5">
                <span className="text-[11px] sm:text-sm font-bold">Kembalian:</span>
                <span className="text-base sm:text-2xl font-black tracking-tight">
                  {isCashSufficient ? formatIDR(change) : `- ${formatIDR(totalAmount - numericCash)}`}
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={!isCashSufficient || isProcessing}
              onClick={handlePayCash}
              className={`w-full rounded-xl py-3 text-sm sm:text-base font-bold text-white shadow-lg transition flex items-center justify-center gap-2 ${
                isCashSufficient && !isProcessing
                  ? "bg-blue-600 hover:bg-blue-700 shadow-blue-600/30 cursor-pointer active:scale-98"
                  : "bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed"
              }`}
            >
              {isProcessing ? (
                <>
                  <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full"></span>
                  Memproses...
                </>
              ) : (
                "Konfirmasi Bayar"
              )}
            </button>
          </div>
        )}

        {method === "QRIS" && (
          <div className="mt-3 space-y-2.5 text-center">
            <div className="rounded-2xl border-2 border-blue-200 dark:border-slate-700 p-2.5 sm:p-4 bg-sky-50/40 dark:bg-slate-800/60 shadow-inner">
              <div className="flex items-center justify-between border-b border-blue-100 dark:border-slate-700 pb-1.5 mb-2">
                <span className="text-[10px] font-black text-rose-600 tracking-wider">QRIS</span>
                <span className="text-[10px] font-black text-blue-700 dark:text-blue-400 tracking-wider">
                  {isCustomQris ? "QRIS TOKO" : "BCA"}
                </span>
              </div>

              <div className="mx-auto w-40 h-40 sm:w-52 sm:h-52 bg-white p-2 rounded-xl shadow-md flex items-center justify-center overflow-hidden border border-blue-100">
                <img
                  src={qrisImage}
                  alt="QRIS Merchant"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="mt-2">
                <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                  {storeInfo.name}
                </p>
                <p className="text-[10px] text-slate-500 font-mono">NMID: {storeInfo.qrisNmid}</p>
                <div className="mt-0.5 text-sm sm:text-lg font-black text-blue-600 dark:text-blue-400">
                  {formatIDR(totalAmount)}
                </div>
              </div>
            </div>

            <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
              Scan QRIS menggunakan BCA mobile, myBCA, atau e-Wallet lainnya.
            </p>

            <button
              type="button"
              disabled={isProcessing}
              onClick={handlePayQRIS}
              className="w-full rounded-xl bg-blue-600 py-3 text-sm sm:text-base font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition cursor-pointer flex items-center justify-center gap-2 active:scale-98"
            >
              {isProcessing ? (
                <>
                  <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full"></span>
                  Memverifikasi...
                </>
              ) : (
                "Konfirmasi Bayar"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
