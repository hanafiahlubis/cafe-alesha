"use client";

import React, { useState, useMemo, useRef } from "react";
import toast from "react-hot-toast";
import { usePOS } from "@/context/POSContext";
import { Transaction } from "@/types/pos";

export const SalesHistory: React.FC = () => {
  const { transactions, storeInfo, deleteTransaction, deleteBulkTransactions, restoreTransaction } = usePOS();

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

  // State Pop-up Hapus Transaksi (Hanya untuk Laptop / Layar Lebar)
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState<boolean>(false);
  const [isDeletingTx, setIsDeletingTx] = useState<boolean>(false);

  // FITUR: State Tab Status Transaksi (Aktif vs Soft-Deleted / Cancelled)
  const [statusTab, setStatusTab] = useState<"ACTIVE" | "CANCELLED">("ACTIVE");
  const [cancelledTxs, setCancelledTxs] = useState<Transaction[]>([]);
  const [isLoadingCancelled, setIsLoadingCancelled] = useState<boolean>(false);
  const [restoringTxId, setRestoringTxId] = useState<string | null>(null);

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

  const cancelledFilteredTx = useMemo(() => {
    return cancelledTxs.filter((tx) => {
      return methodFilter === "Semua" ? true : tx.paymentMethod === methodFilter;
    });
  }, [cancelledTxs, methodFilter]);

  const displayedTxs = statusTab === "ACTIVE" ? filteredTx : cancelledFilteredTx;

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
            <div class="bold" style="font-size: 13px;">${storeInfo.name}</div>
            <div>${storeInfo.address}</div>
            <div>Telp: ${storeInfo.phone}</div>
            <div class="double-line"></div>
            <div class="bold" style="font-size: 12px;">REKAP GABUNGAN PESANAN</div>
            <div style="font-size: 10px; color: #555;">${selectedList.length} Struk Pembayaran Dipilih</div>
            <div>Tgl: ${printDate}</div>
            
            <div class="queue-box">
              <div style="font-size: 9px; font-weight: bold;">ANTREAN TERAKHIR</div>
              <div class="queue-num">${latestQueueNumber}</div>
            </div>
            <div class="double-line"></div>
          </div>

          ${qrisList.length > 0 ? `
            <div class="group-title">-- PEMBAYARAN QRIS (${qrisList.length} TX) --</div>
            ${qrisList.map(tx => `
              <div class="tx-header">
                <span>${tx.queueNumber} (${formatShortId(tx.id)})</span>
                <span style="float: right;">${new Date(tx.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              ${tx.items.map(it => `
                <div class="row">
                  <span>${it.quantity}x ${it.menuItem.name}</span>
                  <span class="text-right">${formatIDR(it.menuItem.price * it.quantity)}</span>
                </div>
              `).join('')}
              <div class="row bold" style="margin-top: 1px;">
                <span>Subtotal Struk:</span>
                <span>${formatIDR(tx.total)}</span>
              </div>
              <div class="line"></div>
            `).join('')}
            <div class="row bold" style="font-size: 11px;">
              <span>TOTAL QRIS:</span>
              <span>${formatIDR(sumQris)}</span>
            </div>
            <div class="line"></div>
          ` : ''}

          ${cashList.length > 0 ? `
            <div class="group-title">-- PEMBAYARAN CASH (${cashList.length} TX) --</div>
            ${cashList.map(tx => `
              <div class="tx-header">
                <span>${tx.queueNumber} (${formatShortId(tx.id)})</span>
                <span style="float: right;">${new Date(tx.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              ${tx.items.map(it => `
                <div class="row">
                  <span>${it.quantity}x ${it.menuItem.name}</span>
                  <span class="text-right">${formatIDR(it.menuItem.price * it.quantity)}</span>
                </div>
              `).join('')}
              <div class="row bold" style="margin-top: 1px;">
                <span>Subtotal Struk:</span>
                <span>${formatIDR(tx.total)}</span>
              </div>
              <div class="line"></div>
            `).join('')}
            <div class="row bold" style="font-size: 11px;">
              <span>TOTAL CASH:</span>
              <span>${formatIDR(sumCash)}</span>
            </div>
            <div class="line"></div>
          ` : ''}

          <div class="double-line"></div>
          <div class="row extra-bold" style="font-size: 13px;">
            <span>GRAND TOTAL:</span>
            <span>${formatIDR(grandTotal)}</span>
          </div>
          <div class="double-line"></div>

          <div class="text-center" style="margin-top: 6px; font-size: 10px;">
            <div>Dicetak Pada: ${new Date().toLocaleTimeString('id-ID')} WIB</div>
            <div>-- TERIMA KASIH --</div>
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 300);
  };

  // Fetch transaksi yang di-soft delete (dibatalkan)
  const fetchCancelledTxs = async () => {
    setIsLoadingCancelled(true);
    try {
      const res = await fetch(
        `/api/orders?status=CANCELLED&startDate=${startDate}&endDate=${endDate}`
      );
      if (res.ok) {
        const json = await res.json();
        if (json.data) setCancelledTxs(json.data);
      }
    } catch (e) {
      console.warn("Gagal memuat transaksi dibatalkan:", e);
    } finally {
      setIsLoadingCancelled(false);
    }
  };

  React.useEffect(() => {
    if (statusTab === "CANCELLED") {
      fetchCancelledTxs();
    }
  }, [statusTab, startDate, endDate]);

  // HANDLER SOFT DELETE 1 TRANSAKSI (LAPTOP ONLY)
  const handleConfirmDeleteSingle = async () => {
    if (!txToDelete) return;

    setIsDeletingTx(true);
    const shortName = formatShortId(txToDelete.id);
    try {
      const success = await deleteTransaction(txToDelete.id);
      if (success) {
        setSelectedTxIds((prev) => prev.filter((id) => id !== txToDelete.id));
        toast.success(`Transaksi ${shortName} berhasil di-soft delete (dibatalkan)!`);
        setTxToDelete(null);
        if (statusTab === "CANCELLED") fetchCancelledTxs();
      } else {
        toast.error("Gagal membatalkan transaksi di server.");
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal membatalkan transaksi");
    } finally {
      setIsDeletingTx(false);
    }
  };

  // HANDLER SOFT DELETE BANYAK TRANSAKSI (BULK DELETE LAPTOP ONLY)
  const handleConfirmDeleteBulk = async () => {
    if (selectedTxIds.length === 0) return;

    setIsDeletingTx(true);
    const count = selectedTxIds.length;
    try {
      const success = await deleteBulkTransactions(selectedTxIds);
      if (success) {
        setSelectedTxIds([]);
        toast.success(`${count} transaksi berhasil di-soft delete (dibatalkan)!`);
        setIsBulkDeleting(false);
        if (statusTab === "CANCELLED") fetchCancelledTxs();
      } else {
        toast.error("Gagal membatalkan transaksi yang dipilih.");
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal membatalkan transaksi");
    } finally {
      setIsDeletingTx(false);
    }
  };

  // HANDLER PULIHKAN (RESTORE) TRANSAKSI YANG DI-SOFT DELETE
  const handleRestoreSingle = async (txId: string) => {
    setRestoringTxId(txId);
    try {
      const success = await restoreTransaction(txId);
      if (success) {
        toast.success("Transaksi berhasil dipulihkan ke status aktif!");
        setCancelledTxs((prev) => prev.filter((t) => t.id !== txId));
      } else {
        toast.error("Gagal memulihkan transaksi.");
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal memulihkan transaksi");
    } finally {
      setRestoringTxId(null);
    }
  };

  const selectedTotal = useMemo(() => {
    return transactions
      .filter((t) => selectedTxIds.includes(t.id))
      .reduce((sum, t) => sum + t.total, 0);
  }, [transactions, selectedTxIds]);

  return (
    <div className="min-h-screen bg-[#F0F7FF] dark:bg-slate-950 pt-16 sm:pt-20 pb-24 text-slate-900 dark:text-slate-50 transition-colors duration-200">
      <div className="mx-auto max-w-7xl px-2.5 sm:px-6 lg:px-8 space-y-3 sm:space-y-4">
        {/* HEADER & FILTER */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 p-3 sm:p-4 shadow-sm border border-blue-100 dark:border-slate-800 space-y-2.5 sm:space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl">📊</span>
                <h1 className="text-sm sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                  Rekap &amp; Riwayat Penjualan
                </h1>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">
                Pantau omzet kasir, cetak struk gabungan, dan rekap pembayaran.
              </p>
            </div>

            {/* PRESET FILTER CEPAT */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase mr-1">
                FILTER:
              </span>
              <button
                type="button"
                onClick={handleSelectToday}
                className="rounded-xl border border-blue-200 bg-blue-50/80 px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition cursor-pointer"
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={handleSelectThisMonth}
                className="rounded-xl border border-blue-200 bg-blue-50/80 px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition cursor-pointer"
              >
                Bulan Ini
              </button>
            </div>
          </div>

          {/* DATE RANGE PICKER RESPONSIF (2 KOLOM DI MOBILE, TIDAK AKAN WRAP BERANTAKAN) */}
          <div className="pt-2 border-t border-blue-50 dark:border-slate-800">
            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2.5">
              <div className="w-full sm:w-auto">
                <span className="block sm:hidden text-[9px] font-bold text-slate-400 uppercase mb-0.5">
                  Dari Tanggal
                </span>
                <div className="flex items-center gap-1.5 rounded-xl border border-blue-200 dark:border-slate-700 bg-sky-50/40 dark:bg-slate-800 px-2.5 py-1.5 text-xs">
                  <span className="hidden sm:inline text-slate-400 font-semibold text-[11px]">Dari:</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-transparent font-bold text-slate-800 dark:text-white focus:outline-none cursor-pointer text-xs"
                  />
                </div>
              </div>

              <div className="w-full sm:w-auto">
                <span className="block sm:hidden text-[9px] font-bold text-slate-400 uppercase mb-0.5">
                  Sampai Tanggal
                </span>
                <div className="flex items-center gap-1.5 rounded-xl border border-blue-200 dark:border-slate-700 bg-sky-50/40 dark:bg-slate-800 px-2.5 py-1.5 text-xs">
                  <span className="hidden sm:inline text-slate-400 font-semibold text-[11px]">s/d:</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-transparent font-bold text-slate-800 dark:text-white focus:outline-none cursor-pointer text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BADGE TANGGAL */}
        <div className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 text-[11px] sm:text-xs font-bold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 shadow-sm">
          <span>📅</span> {reportTitleLabel}
        </div>

        {/* 4 KARTU RINGKASAN: RAPI 2x2 SIMETRIS DI MOBILE, 4 KOLOM DI LAPTOP (TANPA LUBANG KOSONG) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          {/* Card 1: TOTAL PEMASUKAN */}
          <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-sky-600 p-3 sm:p-4 text-white shadow-md shadow-blue-500/20 flex flex-col justify-between">
            <div>
              <span className="text-[9px] sm:text-xs font-medium text-blue-100 uppercase tracking-wider block">
                TOTAL PEMASUKAN
              </span>
              <div className="text-base sm:text-xl lg:text-2xl font-black mt-0.5 tracking-tight truncate">
                {formatIDR(totalRevenue)}
              </div>
            </div>
            <p className="text-[9px] sm:text-[10px] text-blue-100 mt-1">Semua metode bayar</p>
          </div>

          {/* Card 2: TOTAL TRANSAKSI */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 p-3 sm:p-4 border border-blue-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-[9px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider block truncate">
                TOTAL TRANSAKSI
              </span>
              <div className="text-base sm:text-xl lg:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                {totalTransactions} <span className="text-[10px] sm:text-xs font-medium text-slate-400">struk</span>
              </div>
            </div>
            <p className="text-[9px] sm:text-[10px] text-slate-400 mt-1">Pelanggan dilayani</p>
          </div>

          {/* Card 3: CASH */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 p-3 sm:p-4 border border-emerald-200 dark:border-emerald-900/60 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-1">
                <span className="text-[9px] sm:text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider truncate">
                  💵 CASH
                </span>
                <span className="text-[8px] sm:text-[9px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.2 rounded-full">
                  {countCash} tx
                </span>
              </div>
              <div className="text-base sm:text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">
                {formatIDR(totalCash)}
              </div>
            </div>
            <p className="text-[9px] sm:text-[10px] text-slate-400 mt-1">{cashPercentage}% dari total</p>
          </div>

          {/* Card 4: QRIS */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 p-3 sm:p-4 border border-sky-200 dark:border-blue-900/60 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-1">
                <span className="text-[9px] sm:text-xs font-semibold text-sky-600 dark:text-blue-400 uppercase tracking-wider truncate">
                  📱 QRIS
                </span>
                <span className="text-[8px] sm:text-[9px] font-bold text-blue-700 bg-blue-50 dark:bg-blue-950 px-1.5 py-0.2 rounded-full">
                  {countQris} tx
                </span>
              </div>
              <div className="text-base sm:text-xl font-black text-sky-600 dark:text-blue-400 mt-0.5 truncate">
                {formatIDR(totalQris)}
              </div>
            </div>
            <p className="text-[9px] sm:text-[10px] text-slate-400 mt-1">{qrisPercentage}% dari total</p>
          </div>
        </div>

        {/* PROGRESS BAR RATIO CASH vs QRIS */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 p-3 sm:p-3.5 border border-blue-100 dark:border-slate-800 shadow-sm space-y-1.5">
          <div className="flex items-center justify-between text-[10px] sm:text-xs font-bold">
            <span className="text-emerald-700 dark:text-emerald-400 truncate flex items-center gap-1">
              <span>💵 Cash:</span> <span>{formatIDR(totalCash)}</span> <span className="text-slate-400 font-normal">({cashPercentage}%)</span>
            </span>
            <span className="text-blue-700 dark:text-blue-400 truncate flex items-center gap-1">
              <span>📱 QRIS:</span> <span>{formatIDR(totalQris)}</span> <span className="text-slate-400 font-normal">({qrisPercentage}%)</span>
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
          <div className="sticky top-16 sm:top-20 z-30 flex items-center justify-between gap-2.5 rounded-2xl bg-blue-600 px-3 sm:px-5 py-2.5 sm:py-3 text-white shadow-xl shadow-blue-600/30 animate-fadeIn border border-blue-500/30">
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
                className="rounded-xl bg-blue-700/60 hover:bg-blue-700 border border-blue-400/30 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-bold text-white transition active:scale-95 cursor-pointer whitespace-nowrap"
              >
                Batal
              </button>

              {/* FITUR HAPUS TERPILIH (KHUSUS LAPTOP / DESKTOP) */}
              <button
                type="button"
                onClick={() => setIsBulkDeleting(true)}
                className="hidden sm:inline-flex items-center gap-1 rounded-xl bg-rose-600 hover:bg-rose-700 border border-rose-400 px-3 py-1.5 sm:py-2 text-xs font-bold text-white shadow-md transition active:scale-95 cursor-pointer whitespace-nowrap"
                title="Hapus transaksi terpilih (Khusus Laptop)"
              >
                <span>🗑️</span>
                <span>Hapus ({selectedTxIds.length})</span>
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

        {/* TABEL DAFTAR TRANSAKSI */}
        <div className="overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-blue-100 dark:border-slate-800">
          <div className="p-2.5 sm:p-3.5 bg-sky-50/50 dark:bg-slate-800/50 border-b border-blue-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {statusTab === "ACTIVE" && (
                <input
                  type="checkbox"
                  checked={selectedTxIds.length === filteredTx.length && filteredTx.length > 0}
                  onChange={handleSelectAll}
                  className="h-4 w-4 rounded text-blue-600 cursor-pointer"
                  title="Pilih Semua"
                />
              )}
              {/* TAB STATUS TRANSAKSI */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setStatusTab("ACTIVE")}
                  className={`rounded-lg px-2.5 py-1 text-[10px] sm:text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                    statusTab === "ACTIVE"
                      ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <span>✅ Aktif ({filteredTx.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatusTab("CANCELLED")}
                  className={`rounded-lg px-2.5 py-1 text-[10px] sm:text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                    statusTab === "CANCELLED"
                      ? "bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <span>🚫 Dibatalkan ({cancelledFilteredTx.length})</span>
                </button>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {["Semua", "Cash", "QRIS"].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethodFilter(m)}
                  className={`rounded-lg px-2.5 py-1 text-[10px] sm:text-xs font-bold transition cursor-pointer ${
                    methodFilter === m
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-blue-100 dark:border-transparent hover:bg-blue-50"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* TAMPILAN MOBILE (KARTU - BERSIH TANPA TOMBOL HAPUS, SESUAI REQUEST KHUSUS LAPTOP) */}
          <div className="sm:hidden divide-y divide-blue-50 dark:divide-slate-800 p-2 space-y-2">
            {displayedTxs.map((tx) => {
              const isSelected = selectedTxIds.includes(tx.id);
              return (
                <div
                  key={tx.id}
                  onTouchStart={() => handleTouchStart(tx.id)}
                  onTouchEnd={handleTouchEnd}
                  onClick={() => selectedTxIds.length > 0 && toggleSelectTx(tx.id)}
                  className={`p-2.5 sm:p-3 rounded-xl space-y-2 border transition cursor-pointer select-none ${
                    isSelected
                      ? "bg-blue-50/90 dark:bg-blue-950/70 border-blue-300 dark:border-blue-700 shadow-sm"
                      : "bg-sky-50/30 dark:bg-slate-800/40 border-blue-100/60 dark:border-slate-800 hover:border-blue-200"
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
                        <span className="font-mono text-[10px] text-slate-700 dark:text-slate-300 font-bold block truncate">
                          {formatShortId(tx.id)}
                        </span>
                        <span className="text-[9px] text-slate-400 block">{tx.date}</span>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold ${
                        tx.paymentMethod === "Cash"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                      }`}
                    >
                      {tx.paymentMethod === "Cash" ? "💵 Cash" : "📱 QRIS"}
                    </span>
                  </div>

                  <div className="text-[11px] space-y-0.5 text-slate-700 dark:text-slate-300 bg-white/70 dark:bg-slate-900/60 p-2 rounded-xl border border-blue-50 dark:border-slate-800">
                    {tx.items.map((i, idx) => (
                      <div key={idx} className="flex justify-between gap-1">
                        <span className="truncate">
                          <strong className="text-blue-600 dark:text-blue-400 font-semibold">{i.quantity}x</strong> {i.menuItem.name}
                        </span>
                        <span className="text-slate-500 font-medium shrink-0">
                          {formatIDR(i.menuItem.price * i.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-blue-100 dark:border-slate-800 text-[10px]">
                    <span className="text-slate-400">
                      🕒 {new Date(tx.timestamp).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })} WIB
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-[9px] text-slate-400 uppercase font-semibold">Total:</span>
                      <span className="text-xs font-black text-blue-600 dark:text-blue-400">
                        {formatIDR(tx.total)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* TAMPILAN TABLE DESKTOP / LAPTOP (DILENGKAPI KOLOM AKSI HAPUS) */}
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
                  {/* FITUR: Kolom Aksi Khusus Laptop */}
                  <th className="px-4 py-3.5 text-center w-24">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-50 dark:divide-slate-800">
                {displayedTxs.map((tx) => {
                  const isSelected = selectedTxIds.includes(tx.id);
                  return (
                    <tr
                      key={tx.id}
                      onClick={() => toggleSelectTx(tx.id)}
                      className={`transition cursor-pointer ${
                        isSelected
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
                          className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                            tx.paymentMethod === "Cash"
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

                      {/* Kolom Aksi Khusus Laptop: Hapus (Soft Delete) atau Pulihkan */}
                      <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                        {statusTab === "ACTIVE" ? (
                          <button
                            type="button"
                            onClick={() => setTxToDelete(tx)}
                            className="inline-flex items-center gap-1 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 px-2.5 py-1 text-xs font-bold transition active:scale-95 cursor-pointer shadow-sm"
                            title="Batalkan / Soft Delete Transaksi"
                          >
                            <svg className="w-3.5 h-3.5 fill-none stroke-current" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span>Hapus</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={restoringTxId === tx.id}
                            onClick={() => handleRestoreSingle(tx.id)}
                            className="inline-flex items-center gap-1 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 text-xs font-bold transition active:scale-95 cursor-pointer shadow-sm"
                            title="Pulihkan Transaksi ke Aktif"
                          >
                            <span>🔄</span>
                            <span>{restoringTxId === tx.id ? "Memulihkan..." : "Pulihkan"}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {displayedTxs.length === 0 && (
            <div className="p-6 text-center text-xs text-slate-500">
              {statusTab === "ACTIVE"
                ? "Belum ada transaksi aktif untuk rentang tanggal ini."
                : "Tidak ada transaksi yang dibatalkan (soft delete) untuk rentang tanggal ini."}
            </div>
          )}
        </div>
      </div>

      {/* MODAL POP-UP KONFIRMASI HAPUS 1 TRANSAKSI */}
      {txToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-2xl border border-rose-200 dark:border-rose-900/60 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 text-2xl shadow-inner">
                ⚠️
              </div>
              <div>
                <h4 className="font-black text-base text-slate-900 dark:text-white leading-tight">
                  Batalkan Transaksi (Soft Delete)?
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Data tetap tersimpan di database sebagai arsip pembatalan.
                </p>
              </div>
            </div>

            {/* Info Rincian Transaksi */}
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-3.5 border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Nomor Transaksi:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {formatShortId(txToDelete.id)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Nomor Antrean:</span>
                <span className="font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-lg">
                  {txToDelete.queueNumber}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Metode Pembayaran:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {txToDelete.paymentMethod === "Cash" ? "💵 Cash" : "📱 QRIS"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Tanggal &amp; Waktu:</span>
                <span className="text-slate-600 dark:text-slate-300">
                  {txToDelete.date} • {new Date(txToDelete.timestamp).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-200/80 dark:border-slate-700 pt-1.5">
                <span className="text-slate-700 dark:text-slate-300 font-bold">Total Pembayaran:</span>
                <span className="text-sm font-black text-rose-600 dark:text-rose-400">
                  {formatIDR(txToDelete.total)}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-blue-700 dark:text-blue-300 font-medium bg-blue-50 dark:bg-blue-950/40 p-2.5 rounded-xl border border-blue-200 dark:border-blue-900">
              ℹ️ <strong>Soft Delete:</strong> Data transaksi tidak dihapus dari database. Statusnya diubah menjadi <strong>CANCELLED</strong> sehingga tidak dihitung dalam total omzet dan dapat dipulihkan sewaktu-waktu.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                disabled={isDeletingTx}
                onClick={() => setTxToDelete(null)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeletingTx}
                onClick={handleConfirmDeleteSingle}
                className="w-full rounded-xl bg-rose-600 hover:bg-rose-700 py-2.5 text-xs font-bold text-white shadow-md shadow-rose-600/30 transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isDeletingTx ? "Memproses..." : "Ya, Batalkan Transaksi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL POP-UP KONFIRMASI HAPUS BANYAK TRANSAKSI (BULK DELETE) */}
      {isBulkDeleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-2xl border border-rose-200 dark:border-rose-900/60 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 text-2xl shadow-inner">
                ⚠️
              </div>
              <div>
                <h4 className="font-black text-base text-slate-900 dark:text-white leading-tight">
                  Batalkan {selectedTxIds.length} Transaksi Terpilih (Soft Delete)?
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Status transaksi akan diubah ke CANCELLED tanpa menghapus data dari database.
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/30 p-3.5 border border-rose-200 dark:border-rose-900/60 space-y-1 text-xs">
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                <span>Jumlah Struk:</span>
                <span className="font-black text-slate-900 dark:text-white">{selectedTxIds.length} transaksi</span>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                <span>Total Omzet Terhapus:</span>
                <span className="font-black text-rose-600 dark:text-rose-400 text-sm">
                  {formatIDR(selectedTotal)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                disabled={isDeletingTx}
                onClick={() => setIsBulkDeleting(false)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeletingTx}
                onClick={handleConfirmDeleteBulk}
                className="w-full rounded-xl bg-rose-600 hover:bg-rose-700 py-2.5 text-xs font-bold text-white shadow-md shadow-rose-600/30 transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isDeletingTx ? "Memproses..." : `Ya, Batalkan (${selectedTxIds.length}) Struk`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};