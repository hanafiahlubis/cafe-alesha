"use client";

import React, { useState, useMemo, useRef } from "react";
import { usePOS } from "@/context/POSContext";
import { Transaction } from "@/types/pos";

export const SalesHistory: React.FC = () => {
  const { transactions, storeInfo } = usePOS();

  // Helper tanggal lokal YYYY-MM-DD
  const getTodayStr = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const getFirstDayOfMonth = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}-01`;
  };

  // State Date Range Picker
  const [startDate, setStartDate] = useState<string>(getTodayStr());
  const [endDate, setEndDate] = useState<string>(getTodayStr());
  const [methodFilter, setMethodFilter] = useState<string>("Semua");

  // State Multi-Select & Bulk Print
  const [selectedTxIds, setSelectedTxIds] = useState<string[]>([]);
  const touchTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Format IDR
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);
  };

  // Helper nomor transaksi pendek agar rapi di struk thermal
  const formatShortId = (id: string) => {
    if (!id) return "";
    if (id.startsWith("TX-") && id.length <= 12) return id;
    return `TX-${id.slice(-6).toUpperCase()}`;
  };

  // Filter Transaksi berdasarkan Rentang Tanggal
  const dateTxs = useMemo(() => {
    return transactions.filter((tx) => {
      if (!tx.date) return false;
      const matchStart = startDate ? tx.date >= startDate : true;
      const matchEnd = endDate ? tx.date <= endDate : true;
      return matchStart && matchEnd;
    });
  }, [transactions, startDate, endDate]);

  const filteredTx = useMemo(() => {
    return dateTxs.filter((tx) => {
      return methodFilter === "Semua" ? true : tx.paymentMethod === methodFilter;
    });
  }, [dateTxs, methodFilter]);

  // Kalkulasi Finansial
  const totalRevenue = dateTxs.reduce((sum, tx) => sum + tx.total, 0);
  const cashTxs = dateTxs.filter((tx) => tx.paymentMethod === "Cash");
  const qrisTxs = dateTxs.filter((tx) => tx.paymentMethod === "QRIS");
  const totalCash = cashTxs.reduce((sum, tx) => sum + tx.total, 0);
  const totalQris = qrisTxs.reduce((sum, tx) => sum + tx.total, 0);
  const totalTransactions = dateTxs.length;
  const countCash = cashTxs.length;
  const countQris = qrisTxs.length;
  const cashPercentage = totalRevenue > 0 ? Math.round((totalCash / totalRevenue) * 100) : 0;
  const qrisPercentage = totalRevenue > 0 ? Math.round((totalQris / totalRevenue) * 100) : 0;

  // Label Lencana Tanggal (Badge)
  const reportTitleLabel = useMemo(() => {
    if (!startDate && !endDate) return "Semua Periode";
    if (startDate === endDate) {
      try {
        const d = new Date(`${startDate}T00:00:00`);
        return d.toLocaleDateString("id-ID", {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
        });
      } catch {
        return startDate;
      }
    }
    return `${startDate} s/d ${endDate}`;
  }, [startDate, endDate]);

  const handleSelectToday = () => {
    const today = getTodayStr();
    setStartDate(today);
    setEndDate(today);
  };

  const handleSelectThisMonth = () => {
    setStartDate(getFirstDayOfMonth());
    setEndDate(getTodayStr());
  };

  // Multi-Select Handlers
  const toggleSelectTx = (id: string) => {
    setSelectedTxIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedTxIds.length === filteredTx.length && filteredTx.length > 0) {
      setSelectedTxIds([]);
    } else {
      setSelectedTxIds(filteredTx.map((t) => t.id));
    }
  };

  // Gesture Long-Press
  const handleTouchStart = (id: string) => {
    touchTimerRef.current = setTimeout(() => {
      toggleSelectTx(id);
      if (window.navigator?.vibrate) {
        window.navigator.vibrate(40);
      }
    }, 450);
  };

  const handleTouchEnd = () => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
    }
  };

  // CETAK STRUK DISATUKAN (QRIS SEMUA DI ATAS, CASH SEMUA DI BAWAH, ANTREAN TERAKHIR)
  const handleBulkPrint = () => {
    const selectedList = transactions.filter((t) => selectedTxIds.includes(t.id));
    if (selectedList.length === 0) return;

    // Ambil antrean terakhir dari transaksi yang dipilih
    const latestQueueNumber = selectedList[0]?.queueNumber || "#001";
    const printDate = selectedList[0]?.date || getTodayStr();

    // Pisahkan grup QRIS dan CASH
    const qrisList = selectedList.filter((t) => t.paymentMethod === "QRIS");
    const cashList = selectedList.filter((t) => t.paymentMethod === "Cash");

    const sumQris = qrisList.reduce((sum, t) => sum + t.total, 0);
    const sumCash = cashList.reduce((sum, t) => sum + t.total, 0);
    const grandTotal = sumQris + sumCash;

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Struk Rekap - ${latestQueueNumber}</title>
          <style>
            @page { size: 58mm auto; margin: 0; }
            body {
              margin: 0;
              padding: 6px;
              width: 48mm;
              font-family: 'Courier New', Courier, monospace;
              font-size: 11px;
              color: #000;
              line-height: 1.25;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .bold { font-weight: bold; }
            .extra-bold { font-weight: 900; }
            .line { border-bottom: 1px dashed #000; margin: 4px 0; }
            .double-line { border-bottom: 2px dashed #000; margin: 6px 0; }
            .row { display: flex; justify-content: space-between; margin-bottom: 2px; }
            .queue-box { border: 1px dashed #000; padding: 4px 2px; margin: 4px 0; text-align: center; }
            .queue-num { font-size: 24px; font-weight: 900; margin: 1px 0; }
            .group-title { font-size: 11px; font-weight: 900; text-align: center; background: #eee; padding: 2px 0; margin: 5px 0 3px 0; border: 1px solid #ddd; }
            .tx-header { font-size: 10px; font-weight: bold; margin-top: 4px; border-bottom: 1px dotted #888; }
          </style>
        </head>
        <body>
          <div class="text-center">
            <div class="bold" style="font-size: 13px; text-transform: uppercase;">${storeInfo.name}</div>
            <div>${storeInfo.address || ""}</div>
            <div>Telp: ${storeInfo.phone || ""}</div>
            <div class="line"></div>
            
            <div class="queue-box">
              <div class="bold">NOMOR ANTREAN</div>
              <div class="queue-num">${latestQueueNumber}</div>
              <div style="font-size: 9px;">(Antrean Terakhir • ${selectedList.length} Transaksi)</div>
            </div>
            
            <div class="line"></div>
            <div class="row" style="font-size: 10px;">
              <span>Tanggal: ${printDate}</span>
              <span>Kasir: Utama</span>
            </div>
            <div class="double-line"></div>
          </div>

          <!-- BAGIAN 1: GRUP QRIS -->
          ${qrisList.length > 0
        ? `
              <div class="group-title">--- TRANSAKSI QRIS (${qrisList.length}) ---</div>${qrisList
          .map(
            (tx) => `
                <div style="margin-bottom: 5px;">
                  <div class="row tx-header">
                    <span>${tx.queueNumber} [${formatShortId(tx.id)}]</span>
                    <span>${new Date(tx.timestamp).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  ${tx.items
                .map(
                  (item) => `
                    <div style="margin-top: 2px;">
                      <div>${item.menuItem.name}</div>
                      <div class="row" style="font-size: 10px;">
                        <span>  ${item.quantity} x${formatIDR(item.menuItem.price)}</span>
                        <span>${formatIDR(item.menuItem.price * item.quantity)}</span>
                      </div>
                    </div>`
                )
                .join("")}
                  <div class="row" style="font-size: 10px; font-weight: bold; margin-top: 1px;">
                    <span>Subtotal:</span>
                    <span>${formatIDR(tx.total)}</span>
                  </div>
                </div>`
          )
          .join("")}
              <div class="row bold" style="border-top: 1px dashed #000; padding-top: 2px; margin-top: 2px;">
                <span>TOTAL QRIS:</span>
                <span>${formatIDR(sumQris)}</span>
              </div>
              <div class="line"></div>
            `
        : ""
      }

          <!-- BAGIAN 2: GRUP CASH -->
          ${cashList.length > 0
        ? `
              <div class="group-title">--- TRANSAKSI CASH (${cashList.length}) ---</div>${cashList
          .map(
            (tx) => `
                <div style="margin-bottom: 5px;">
                  <div class="row tx-header">
                    <span>${tx.queueNumber} [${formatShortId(tx.id)}]</span>
                    <span>${new Date(tx.timestamp).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  ${tx.items
                .map(
                  (item) => `
                    <div style="margin-top: 2px;">
                      <div>${item.menuItem.name}</div>
                      <div class="row" style="font-size: 10px;">
                        <span>  ${item.quantity} x${formatIDR(item.menuItem.price)}</span>
                        <span>${formatIDR(item.menuItem.price * item.quantity)}</span>
                      </div>
                    </div>`
                )
                .join("")}
                  <div class="row" style="font-size: 10px; font-weight: bold; margin-top: 1px;">
                    <span>Subtotal:</span>
                    <span>${formatIDR(tx.total)}</span>
                  </div>
                </div>`
          )
          .join("")}
              <div class="row bold" style="border-top: 1px dashed #000; padding-top: 2px; margin-top: 2px;">
                <span>TOTAL CASH:</span>
                <span>${formatIDR(sumCash)}</span>
              </div>
              <div class="line"></div>
            `
        : ""
      }

          <!-- TOTAL GABUNGAN -->
          <div class="double-line"></div>
          <div class="row bold" style="font-size: 12px;">
            <span>GRAND TOTAL:</span>
            <span>${formatIDR(grandTotal)}</span>
          </div>
          <div class="line"></div>

          <div class="text-center" style="font-size: 9px; margin-top: 6px;">
            <div class="bold">TERIMA KASIH ATAS KUNJUNGAN ANDA</div>
            <div>Rekap ${selectedList.length} transaksi selesai</div>
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => document.body.removeChild(iframe), 2000);
    }, 250);
  };

  return (
    <div className="min-h-screen bg-[#F0F7FF] dark:bg-slate-950 pt-2 sm:pt-20 pb-2 lg:pb-16 text-slate-900 dark:text-slate-50 transition-colors duration-200">
      <div className="mx-auto max-w-7xl px-2 sm:px-4 lg:px-8 space-y-2.5 sm:space-y-4">
        {/* HEADER & DATE RANGE FILTER */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 p-2.5 sm:p-4 shadow-sm border border-blue-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-lg sm:text-2xl">📊</span>
                <h1 className="text-xs sm:text-lg font-black text-slate-900 dark:text-white truncate">
                  Riwayat &amp; Rekap Keuangan (NeonDB)
                </h1>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block mt-0.5">
                Rekap pemasukan Cash vs QRIS BCA
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleSelectToday}
                className="rounded-lg sm:rounded-xl border border-blue-200 bg-blue-50/80 px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-bold text-blue-700 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300 transition cursor-pointer active:scale-95"
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={handleSelectThisMonth}
                className="rounded-lg sm:rounded-xl border border-blue-200 bg-blue-50/80 px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-bold text-blue-700 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300 transition cursor-pointer active:scale-95"
              >
                Bulan Ini
              </button>
            </div>
          </div>

          <div className="mt-2.5 pt-2.5 border-t border-blue-50 dark:border-slate-800">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
              <div>
                <label className="block text-[9px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
                  📅 Dari Tanggal
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl border border-blue-200/80 dark:border-slate-700 bg-sky-50/40 dark:bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-[9px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
                  📅 Sampai Tanggal
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-xl border border-blue-200/80 dark:border-slate-700 bg-sky-50/40 dark:bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* BADGE TANGGAL */}
        <div className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 text-[11px] sm:text-xs font-bold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 shadow-sm">
          <span>📅</span> {reportTitleLabel}
        </div>

        {/* 4 KARTU RINGKASAN */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3.5">
          <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-sky-600 p-3 sm:p-4 text-white shadow-md shadow-blue-500/20 col-span-2 sm:col-span-1">
            <span className="text-[9px] sm:text-xs font-medium text-blue-100 uppercase tracking-wider block">
              TOTAL PEMASUKAN
            </span>
            <div className="text-lg sm:text-2xl font-black mt-0.5 tracking-tight truncate">
              {formatIDR(totalRevenue)}
            </div>
            <p className="text-[9px] sm:text-[11px] text-blue-100">Semua metode bayar</p>
          </div>

          <div className="rounded-2xl bg-white dark:bg-slate-900 p-3 sm:p-4 border border-blue-100 dark:border-slate-800 shadow-sm">
            <span className="text-[9px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider block truncate">
              TOTAL TRANSAKSI
            </span>
            <div className="text-base sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {totalTransactions} <span className="text-[10px] sm:text-xs font-medium text-slate-400">struk</span>
            </div>
            <p className="text-[9px] text-slate-400">Pelanggan dilayani</p>
          </div>

          <div className="rounded-2xl bg-white dark:bg-slate-900 p-3 sm:p-4 border border-emerald-200 dark:border-emerald-900/60 shadow-sm">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[9px] sm:text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider truncate">
                💵 CASH
              </span>
              <span className="text-[8px] sm:text-[9px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.2 rounded-full">
                {countCash} tx
              </span>
            </div>
            <div className="text-sm sm:text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">
              {formatIDR(totalCash)}
            </div>
            <p className="text-[9px] text-slate-400">{cashPercentage}% total</p>
          </div>

          <div className="rounded-2xl bg-white dark:bg-slate-900 p-3 sm:p-4 border border-sky-200 dark:border-blue-900/60 shadow-sm">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[9px] sm:text-xs font-semibold text-sky-600 dark:text-blue-400 uppercase tracking-wider truncate">
                📱 QRIS
              </span>
              <span className="text-[8px] sm:text-[9px] font-bold text-blue-700 bg-blue-50 dark:bg-blue-950 px-1.5 py-0.2 rounded-full">
                {countQris} tx
              </span>
            </div>
            <div className="text-sm sm:text-xl font-black text-sky-600 dark:text-blue-400 mt-0.5 truncate">
              {formatIDR(totalQris)}
            </div>
            <p className="text-[9px] text-slate-400">{qrisPercentage}% total</p>
          </div>
        </div>

        {/* PROGRESS BAR */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 p-3 sm:p-4 border border-blue-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-[10px] sm:text-xs font-bold mb-1.5">
            <span className="text-emerald-700 dark:text-emerald-400 truncate">
              Cash: {formatIDR(totalCash)} ({cashPercentage}%)
            </span>
            <span className="text-blue-700 dark:text-blue-400 truncate">
              QRIS: {formatIDR(totalQris)} ({qrisPercentage}%)
            </span>
          </div>
          <div className="h-2 sm:h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
            <div
              style={{ width: `${cashPercentage}%` }}
              className="bg-emerald-500 transition-all duration-500"
            ></div>
            <div
              style={{ width: `${qrisPercentage}%` }}
              className="bg-blue-600 transition-all duration-500"
            ></div>
          </div>
        </div>

        {/* FLOATING ACTION BAR SAAT TRANSAKSI DIPILIH */}
        {selectedTxIds.length > 0 && (
          <div className="sticky top-16 sm:top-20 z-30 flex items-center justify-between gap-3 rounded-2xl bg-blue-600 px-3 sm:px-5 py-2.5 sm:py-3 text-white shadow-xl shadow-blue-600/30 animate-fadeIn border border-blue-500/30">
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-white text-xs sm:text-sm font-black text-blue-600 shadow-sm">
                {selectedTxIds.length}
              </span>
              <span className="text-xs sm:text-sm font-bold whitespace-nowrap">
                Struk Dipilih
              </span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedTxIds([])}
                className="rounded-xl bg-blue-700/60 hover:bg-blue-700 border border-blue-400/30 px-3 py-1.5 sm:py-2 text-xs font-bold text-white transition active:scale-95 cursor-pointer whitespace-nowrap"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleBulkPrint}
                className="rounded-xl bg-white hover:bg-blue-50 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-blue-600 shadow-md transition active:scale-95 cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
              >
                <span>🖨️</span>
                <span>Cetak Struk Gabungan</span>
              </button>
            </div>
          </div>
        )}

        {/* TABEL DAFTAR TRANSAKSI DENGAN NOMOR PENDEK & CHECKBOX */}
        <div className="overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-blue-100 dark:border-slate-800">
          <div className="p-2.5 sm:p-4 bg-sky-50/50 dark:bg-slate-800/50 border-b border-blue-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedTxIds.length === filteredTx.length && filteredTx.length > 0}
                onChange={handleSelectAll}
                className="h-4 w-4 rounded text-blue-600 cursor-pointer"
                title="Pilih Semua"
              />
              <h3 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                Daftar Transaksi ({filteredTx.length})
              </h3>
            </div>
            <div className="flex items-center gap-1">
              {["Semua", "Cash", "QRIS"].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethodFilter(m)}
                  className={`rounded-lg px-2.5 py-1 text-[10px] sm:text-xs font-bold transition cursor-pointer ${methodFilter === m
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-blue-100 dark:border-transparent hover:bg-blue-50"
                    }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* TAMPILAN MOBILE (KARTU) */}
          <div className="sm:hidden divide-y divide-blue-50 dark:divide-slate-800 p-1.5 space-y-1.5">
            {filteredTx.map((tx) => {
              const isSelected = selectedTxIds.includes(tx.id);
              return (
                <div
                  key={tx.id}
                  onTouchStart={() => handleTouchStart(tx.id)}
                  onTouchEnd={handleTouchEnd}
                  onClick={() => selectedTxIds.length > 0 && toggleSelectTx(tx.id)}
                  className={`p-2.5 rounded-xl space-y-1.5 border transition cursor-pointer select-none ${isSelected
                    ? "bg-blue-50/90 dark:bg-blue-950/70 border-blue-300 dark:border-blue-700"
                    : "bg-sky-50/30 dark:bg-slate-800/40 border-blue-100/60 dark:border-slate-800"
                    }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectTx(tx.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4 rounded text-blue-600 cursor-pointer"
                      />
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-600 font-black text-[10px] text-white shadow-sm">
                        {tx.queueNumber}
                      </span>
                      <div className="min-w-0">
                        <span className="font-mono text-[10px] text-slate-600 dark:text-slate-400 font-bold block truncate">
                          {formatShortId(tx.id)}
                        </span>
                        <span className="text-[9px] text-slate-400 block">{tx.date}</span>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${tx.paymentMethod === "Cash"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                        }`}
                    >
                      {tx.paymentMethod === "Cash" ? "💵 Cash" : "📱 QRIS"}
                    </span>
                  </div>
                  <div className="text-[11px] space-y-0.5 text-slate-700 dark:text-slate-300 bg-white/60 dark:bg-slate-900/60 p-1.5 rounded-lg">
                    {tx.items.map((i, idx) => (
                      <div key={idx} className="flex justify-between gap-1">
                        <span className="truncate">
                          {i.quantity}x {i.menuItem.name}
                        </span>
                        <span className="text-slate-400 shrink-0">
                          {formatIDR(i.menuItem.price * i.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-blue-100 dark:border-slate-700 text-[10px]">
                    <span className="text-slate-400">
                      {new Date(tx.timestamp).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      WIB
                    </span>
                    <span className="text-xs font-black text-blue-600 dark:text-blue-400">
                      {formatIDR(tx.total)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* TAMPILAN TABLE DESKTOP / TABLET */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-sky-50/40 dark:bg-slate-800/20 text-xs uppercase text-slate-400 font-semibold border-b border-blue-100 dark:border-slate-800">
                <tr>
                  <th className="pl-4 pr-1 py-3.5 w-8">
                    <input
                      type="checkbox"
                      checked={selectedTxIds.length === filteredTx.length && filteredTx.length > 0}
                      onChange={handleSelectAll}
                      className="h-4 w-4 rounded text-blue-600 cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-3.5">ANTREAN</th>
                  <th className="px-4 py-3.5">NO. TRANSAKSI</th>
                  <th className="px-4 py-3.5">TANGGAL &amp; WAKTU</th>
                  <th className="px-6 py-3.5">RINCIAN ITEM</th>
                  <th className="px-4 py-3.5">METODE</th>
                  <th className="px-6 py-3.5 text-right">TOTAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-50 dark:divide-slate-800">
                {filteredTx.map((tx) => {
                  const isSelected = selectedTxIds.includes(tx.id);
                  return (
                    <tr
                      key={tx.id}
                      onClick={() => toggleSelectTx(tx.id)}
                      className={`transition cursor-pointer ${isSelected
                        ? "bg-blue-50/70 dark:bg-blue-950/50"
                        : "hover:bg-blue-50/30 dark:hover:bg-slate-800/40"
                        }`}
                    >
                      <td className="pl-4 pr-1 py-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectTx(tx.id)}
                          className="h-4 w-4 rounded text-blue-600 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/60 font-black text-xs text-blue-700 dark:text-blue-300">
                          {tx.queueNumber}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-mono text-xs text-slate-700 dark:text-slate-300 font-bold">
                        {formatShortId(tx.id)}
                      </td>
                      <td className="px-4 py-4 text-xs">
                        <div>{tx.date}</div>
                        <div className="text-slate-400">
                          {new Date(tx.timestamp).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          WIB
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs space-y-0.5">
                          {tx.items.map((i, idx) => (
                            <div key={idx} className="text-slate-700 dark:text-slate-300">
                              <span className="font-semibold">{i.quantity}x</span> {i.menuItem.name}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${tx.paymentMethod === "Cash"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300"
                            }`}
                        >
                          {tx.paymentMethod === "Cash" ? "💵 Cash" : "📱 QRIS"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-black text-slate-900 dark:text-white">
                        {formatIDR(tx.total)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredTx.length === 0 && (
            <div className="p-6 text-center text-xs text-slate-500">
              Belum ada transaksi tercatat untuk rentang tanggal ini.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};