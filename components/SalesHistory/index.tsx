"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import { usePOS } from "@/context/POSContext";
import { Transaction } from "@/types/pos";
import { Pagination } from "@/components/Common/Pagination";

interface ItemSalesSummary {
  menuId: string;
  name: string;
  category: string;
  unitPrice: number;
  totalQty: number;
  totalRevenue: number;
  orderCount: number;
  percentage: number;
}

export const SalesHistory: React.FC = () => {
  const { transactions, menuList, storeInfo, deleteTransaction, deleteBulkTransactions, restoreTransaction } = usePOS();

  // Helper tanggal lokal YYYY-MM-DD
  const getTodayStr = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const getYesterdayStr = () => {
    const now = new Date();
    now.setDate(now.getDate() - 1);
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

  const getFirstDayOfLastMonth = () => {
    const now = new Date();
    now.setMonth(now.getMonth() - 1);
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}-01`;
  };

  const getLastDayOfLastMonth = () => {
    const now = new Date();
    now.setDate(0); // Hari terakhir bulan lalu
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  // State Date Range Picker
  const [startDate, setStartDate] = useState<string>(getTodayStr());
  const [endDate, setEndDate] = useState<string>(getTodayStr());
  const [methodFilter, setMethodFilter] = useState<string>("Semua");

  // State Tab Utama: "TRANSACTIONS" (Riwayat Transaksi) vs "ITEMS_SOLD" (Rekap Item Terjual / Pcs)
  const [activeMainTab, setActiveMainTab] = useState<"TRANSACTIONS" | "ITEMS_SOLD">("TRANSACTIONS");

  // State Pagination untuk Riwayat Transaksi
  const [txPage, setTxPage] = useState<number>(1);
  const [txsPerPage, setTxsPerPage] = useState<number>(10);

  // State Filter & Pagination untuk Rekap Item Terjual
  const [itemCategoryFilter, setItemCategoryFilter] = useState<string>("Semua");
  const [itemSearch, setItemSearch] = useState<string>("");
  const [itemSortBy, setItemSortBy] = useState<"terlaris" | "terendah" | "omzet" | "nama">("terlaris");
  const [itemPage, setItemPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // State Multi-Select & Bulk Print
  const [selectedTxIds, setSelectedTxIds] = useState<string[]>([]);
  const touchTimerRef = useRef<NodeJS.Timeout | null>(null);

  // State Pop-up Hapus Transaksi (Khusus Laptop / Layar Lebar)
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState<boolean>(false);
  const [isDeletingTx, setIsDeletingTx] = useState<boolean>(false);

  // State Tab Status Transaksi (Aktif vs Soft-Deleted / Cancelled)
  const [statusTab, setStatusTab] = useState<"ACTIVE" | "CANCELLED">("ACTIVE");
  const [cancelledTxs, setCancelledTxs] = useState<Transaction[]>([]);
  const [isLoadingCancelled, setIsLoadingCancelled] = useState<boolean>(false);
  const [restoringTxId, setRestoringTxId] = useState<string | null>(null);

  // Reset pagination saat filter berubah
  useEffect(() => {
    setTxPage(1);
  }, [startDate, endDate, methodFilter, statusTab]);

  useEffect(() => {
    setItemPage(1);
  }, [startDate, endDate, itemCategoryFilter, itemSearch, itemSortBy]);

  // Format IDR
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);
  };

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

  const activeDateTxs = useMemo(() => {
    return dateTxs.filter((tx) => tx.status !== "CANCELLED");
  }, [dateTxs]);

  const filteredTx = useMemo(() => {
    return activeDateTxs.filter((tx) => {
      return methodFilter === "Semua" ? true : tx.paymentMethod === methodFilter;
    });
  }, [activeDateTxs, methodFilter]);

  const cancelledFilteredTx = useMemo(() => {
    return cancelledTxs.filter((tx) => {
      return methodFilter === "Semua" ? true : tx.paymentMethod === methodFilter;
    });
  }, [cancelledTxs, methodFilter]);

  const displayedTxs = statusTab === "ACTIVE" ? filteredTx : cancelledFilteredTx;

  // Pagination Transaksi
  const totalTxPages = Math.ceil(displayedTxs.length / txsPerPage) || 1;
  const paginatedTxs = useMemo(() => {
    const start = (txPage - 1) * txsPerPage;
    return displayedTxs.slice(start, start + txsPerPage);
  }, [displayedTxs, txPage, txsPerPage]);

  // Kalkulasi Finansial
  const totalRevenue = activeDateTxs.reduce((sum, tx) => sum + tx.total, 0);
  const cashTxs = activeDateTxs.filter((tx) => tx.paymentMethod === "Cash");
  const qrisTxs = activeDateTxs.filter((tx) => tx.paymentMethod === "QRIS");
  const totalCash = cashTxs.reduce((sum, tx) => sum + tx.total, 0);
  const totalQris = qrisTxs.reduce((sum, tx) => sum + tx.total, 0);
  const totalTransactions = activeDateTxs.length;
  const countCash = cashTxs.length;
  const countQris = qrisTxs.length;
  const cashPercentage = totalRevenue > 0 ? Math.round((totalCash / totalRevenue) * 100) : 0;
  const qrisPercentage = totalRevenue > 0 ? Math.round((totalQris / totalRevenue) * 100) : 0;

  // =========================================================================
  // FITUR 1: KALKULASI REKAP ITEM TERJUAL (BERAPA PCS / QTY TERJUAL PER MENU)
  // =========================================================================
  const { itemSalesList, totalPcsSold, topSellerItem, totalUniqueItems } = useMemo(() => {
    const map = new Map<
      string,
      {
        menuId: string;
        name: string;
        category: string;
        unitPrice: number;
        totalQty: number;
        totalRevenue: number;
        orderCount: number;
      }
    >();

    let totalPcs = 0;

    activeDateTxs.forEach((tx) => {
      const itemsInThisTx = new Set<string>();

      (tx.items || []).forEach((item) => {
        if (!item || !item.menuItem) return;
        const key = item.menuItem.id || item.menuItem.name;
        const qty = Number(item.quantity) || 1;
        const price = Number(item.menuItem.price) || 0;
        const rev = price * qty;
        totalPcs += qty;

        // Cari kategori dari menuList jika ada
        const matched = menuList.find(
          (m) => m.id === item.menuItem.id || m.name.toLowerCase() === item.menuItem.name.toLowerCase()
        );
        const cat = matched?.category || item.menuItem.category || "Minuman";

        const existing = map.get(key);
        if (existing) {
          existing.totalQty += qty;
          existing.totalRevenue += rev;
          if (!itemsInThisTx.has(key)) {
            existing.orderCount += 1;
            itemsInThisTx.add(key);
          }
        } else {
          itemsInThisTx.add(key);
          map.set(key, {
            menuId: key,
            name: item.menuItem.name,
            category: cat,
            unitPrice: price,
            totalQty: qty,
            totalRevenue: rev,
            orderCount: 1,
          });
        }
      });
    });

    const rawList = Array.from(map.values());

    // Hitung persentase dari total pcs terjual
    const withPercentage: ItemSalesSummary[] = rawList.map((it) => ({
      ...it,
      percentage: totalPcs > 0 ? Math.round((it.totalQty / totalPcs) * 100) : 0,
    }));

    // Cari item terlaris
    let topSeller: ItemSalesSummary | null = null;
    if (withPercentage.length > 0) {
      topSeller = [...withPercentage].sort((a, b) => b.totalQty - a.totalQty)[0];
    }

    return {
      itemSalesList: withPercentage,
      totalPcsSold: totalPcs,
      topSellerItem: topSeller,
      totalUniqueItems: withPercentage.length,
    };
  }, [activeDateTxs, menuList]);

  // Filter & Pengurutan Item Terjual
  const filteredItemSales = useMemo(() => {
    return itemSalesList
      .filter((it) => {
        const matchCat = itemCategoryFilter === "Semua" ? true : it.category === itemCategoryFilter;
        const matchSearch =
          itemSearch.trim() === ""
            ? true
            : it.name.toLowerCase().includes(itemSearch.toLowerCase());
        return matchCat && matchSearch;
      })
      .sort((a, b) => {
        if (itemSortBy === "terlaris") return b.totalQty - a.totalQty;
        if (itemSortBy === "terendah") return a.totalQty - b.totalQty;
        if (itemSortBy === "omzet") return b.totalRevenue - a.totalRevenue;
        if (itemSortBy === "nama") return a.name.localeCompare(b.name);
        return b.totalQty - a.totalQty;
      });
  }, [itemSalesList, itemCategoryFilter, itemSearch, itemSortBy]);

  // Pagination Item Terjual
  const totalItemPages = Math.ceil(filteredItemSales.length / itemsPerPage) || 1;
  const paginatedItemSales = useMemo(() => {
    const start = (itemPage - 1) * itemsPerPage;
    return filteredItemSales.slice(start, start + itemsPerPage);
  }, [filteredItemSales, itemPage, itemsPerPage]);

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

  const handleSelectYesterday = () => {
    const yest = getYesterdayStr();
    setStartDate(yest);
    setEndDate(yest);
  };

  const handleSelectThisMonth = () => {
    setStartDate(getFirstDayOfMonth());
    setEndDate(getTodayStr());
  };

  const handleSelectLastMonth = () => {
    setStartDate(getFirstDayOfLastMonth());
    setEndDate(getLastDayOfLastMonth());
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

  // Cetak Struk Gabungan
  const handleBulkPrint = () => {
    const selectedList = transactions.filter((t) => selectedTxIds.includes(t.id));
    if (selectedList.length === 0) return;

    const latestQueueNumber = selectedList[0]?.queueNumber || "#001";
    const printDate = selectedList[0]?.date || getTodayStr();

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

          ${
            qrisList.length > 0
              ? `
            <div class="group-title">-- PEMBAYARAN QRIS (${qrisList.length} TX) --</div>
            ${qrisList
              .map(
                (tx) => `
              <div class="tx-header">
                <span>${tx.queueNumber} (${formatShortId(tx.id)})</span>
                <span style="float: right;">${new Date(tx.timestamp).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              ${tx.items
                .map(
                  (it) => `
                <div class="row">
                  <span>${it.quantity}x ${it.menuItem.name}</span>
                  <span class="text-right">${formatIDR(it.menuItem.price * it.quantity)}</span>
                </div>
              `
                )
                .join("")}
              <div class="row bold" style="margin-top: 1px;">
                <span>Subtotal Struk:</span>
                <span>${formatIDR(tx.total)}</span>
              </div>
              <div class="line"></div>
            `
              )
              .join("")}
            <div class="row bold" style="font-size: 11px;">
              <span>TOTAL QRIS:</span>
              <span>${formatIDR(sumQris)}</span>
            </div>
            <div class="line"></div>
          `
              : ""
          }

          ${
            cashList.length > 0
              ? `
            <div class="group-title">-- PEMBAYARAN CASH (${cashList.length} TX) --</div>
            ${cashList
              .map(
                (tx) => `
              <div class="tx-header">
                <span>${tx.queueNumber} (${formatShortId(tx.id)})</span>
                <span style="float: right;">${new Date(tx.timestamp).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              ${tx.items
                .map(
                  (it) => `
                <div class="row">
                  <span>${it.quantity}x ${it.menuItem.name}</span>
                  <span class="text-right">${formatIDR(it.menuItem.price * it.quantity)}</span>
                </div>
              `
                )
                .join("")}
              <div class="row bold" style="margin-top: 1px;">
                <span>Subtotal Struk:</span>
                <span>${formatIDR(tx.total)}</span>
              </div>
              <div class="line"></div>
            `
              )
              .join("")}
            <div class="row bold" style="font-size: 11px;">
              <span>TOTAL CASH:</span>
              <span>${formatIDR(sumCash)}</span>
            </div>
            <div class="line"></div>
          `
              : ""
          }

          <div class="double-line"></div>
          <div class="row extra-bold" style="font-size: 13px;">
            <span>GRAND TOTAL:</span>
            <span>${formatIDR(grandTotal)}</span>
          </div>
          <div class="double-line"></div>

          <div class="text-center" style="margin-top: 6px; font-size: 10px;">
            <div>Dicetak Pada: ${new Date().toLocaleTimeString("id-ID")} WIB</div>
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

  const handleConfirmDeleteSingle = async () => {
    if (!txToDelete) return;
    setIsDeletingTx(true);
    const shortName = formatShortId(txToDelete.id);
    try {
      const success = await deleteTransaction(txToDelete.id);
      if (success) {
        setSelectedTxIds((prev) => prev.filter((id) => id !== txToDelete.id));
        toast.success(`Transaksi ${shortName} berhasil di-soft delete!`);
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

  const handleConfirmDeleteBulk = async () => {
    if (selectedTxIds.length === 0) return;
    setIsDeletingTx(true);
    const count = selectedTxIds.length;
    try {
      const success = await deleteBulkTransactions(selectedTxIds);
      if (success) {
        setSelectedTxIds([]);
        toast.success(`${count} transaksi berhasil di-soft delete!`);
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

  const handleRestoreSingle = async (txId: string) => {
    setRestoringTxId(txId);
    try {
      const success = await restoreTransaction(txId);
      if (success) {
        toast.success("Transaksi berhasil dipulihkan!");
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
        {/* HEADER & FILTER TANGGAL RESPONSIF HP */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 p-3 sm:p-4 shadow-sm border border-blue-100 dark:border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl">📊</span>
                <h1 className="text-sm sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                  Rekap &amp; Laporan Penjualan
                </h1>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">
                Pantau omzet kasir, rekap item terjual (pcs), dan cetak struk gabungan.
              </p>
            </div>

            {/* PRESET FILTER CEPAT: HARI INI, KEMARIN, BULAN INI, BULAN LALU */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase mr-0.5 shrink-0">
                FILTER:
              </span>
              <button
                type="button"
                onClick={handleSelectToday}
                className={`rounded-xl px-2.5 py-1 text-xs font-bold transition cursor-pointer shrink-0 ${
                  startDate === getTodayStr() && endDate === getTodayStr()
                    ? "bg-blue-600 text-white shadow-sm"
                    : "border border-blue-200 bg-blue-50/80 text-blue-700 hover:bg-blue-100"
                }`}
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={handleSelectYesterday}
                className={`rounded-xl px-2.5 py-1 text-xs font-bold transition cursor-pointer shrink-0 ${
                  startDate === getYesterdayStr() && endDate === getYesterdayStr()
                    ? "bg-blue-600 text-white shadow-sm"
                    : "border border-blue-200 bg-blue-50/80 text-blue-700 hover:bg-blue-100"
                }`}
              >
                Kemarin
              </button>
              <button
                type="button"
                onClick={handleSelectThisMonth}
                className={`rounded-xl px-2.5 py-1 text-xs font-bold transition cursor-pointer shrink-0 ${
                  startDate === getFirstDayOfMonth() && endDate === getTodayStr()
                    ? "bg-blue-600 text-white shadow-sm"
                    : "border border-blue-200 bg-blue-50/80 text-blue-700 hover:bg-blue-100"
                }`}
              >
                Bulan Ini
              </button>
              <button
                type="button"
                onClick={handleSelectLastMonth}
                className={`rounded-xl px-2.5 py-1 text-xs font-bold transition cursor-pointer shrink-0 ${
                  startDate === getFirstDayOfLastMonth() && endDate === getLastDayOfLastMonth()
                    ? "bg-blue-600 text-white shadow-sm"
                    : "border border-blue-200 bg-blue-50/80 text-blue-700 hover:bg-blue-100"
                }`}
              >
                Bulan Lalu
              </button>
            </div>
          </div>

          {/* DATE RANGE PICKER (BY DATE BISA DIATUR: DARI TGL S/D SAMPAI TGL) */}
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

              {/* LENCANA PERIODE TERPILIH */}
              <div className="col-span-2 sm:col-span-1 sm:ml-auto flex items-center">
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1.5 text-[11px] font-bold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 shadow-xs">
                  <span>📅</span> {reportTitleLabel}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 KARTU RINGKASAN: RAPI 2x2 SIMETRIS DI HP, 4 KOLOM DI DESKTOP */}
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
            <p className="text-[9px] sm:text-[10px] text-slate-400 mt-1">Pesanan selesai</p>
          </div>

          {/* Card 3: TOTAL ITEM / PCS TERJUAL (KLIK UNTUK BUKA TAB ITEM TERJUAL) */}
          <div
            onClick={() => setActiveMainTab("ITEMS_SOLD")}
            className="rounded-2xl bg-white dark:bg-slate-900 p-3 sm:p-4 border border-amber-200 dark:border-amber-900/60 shadow-sm flex flex-col justify-between cursor-pointer hover:border-amber-400 transition"
          >
            <div>
              <div className="flex items-center justify-between gap-1">
                <span className="text-[9px] sm:text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider truncate">
                  📦 ITEM TERJUAL
                </span>
                <span className="text-[8px] sm:text-[9px] font-bold text-amber-700 bg-amber-50 dark:bg-amber-950 px-1.5 py-0.2 rounded-full">
                  {totalUniqueItems} menu
                </span>
              </div>
              <div className="text-base sm:text-xl lg:text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5 truncate">
                {totalPcsSold} <span className="text-[10px] sm:text-xs font-medium text-slate-400">pcs</span>
              </div>
            </div>
            <p className="text-[9px] sm:text-[10px] text-amber-600/80 font-medium mt-1 truncate">
              {topSellerItem ? `Terlaris: ${topSellerItem.name}` : "Klik lihat rincian"}
            </p>
          </div>

          {/* Card 4: CASH vs QRIS */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 p-3 sm:p-4 border border-sky-200 dark:border-blue-900/60 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-[9px] sm:text-xs font-semibold text-sky-600 dark:text-blue-400 uppercase tracking-wider block truncate">
                CASH &amp; QRIS
              </span>
              <div className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200 mt-1 space-y-0.5">
                <div className="flex justify-between">
                  <span className="text-emerald-600 font-bold">💵 Cash:</span>
                  <span>{formatIDR(totalCash)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-600 font-bold">📱 QRIS:</span>
                  <span>{formatIDR(totalQris)}</span>
                </div>
              </div>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex mt-1.5">
              <div style={{ width: `${cashPercentage}%` }} className="bg-emerald-500"></div>
              <div style={{ width: `${qrisPercentage}%` }} className="bg-blue-600"></div>
            </div>
          </div>
        </div>

        {/* TAB SWITCHER UTAMA (SANGAT MUDAH DITAP DI HP):
            TAB 1: 🧾 RIWAYAT TRANSAKSI (STRUK KASIR)
            TAB 2: 📦 REKAP ITEM TERJUAL (BERAPA PCS / QTY TERJUAL PER MENU) */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-200/70 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner">
          <button
            type="button"
            onClick={() => setActiveMainTab("TRANSACTIONS")}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer ${
              activeMainTab === "TRANSACTIONS"
                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm font-black"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <span className="text-base">🧾</span>
            <span>Daftar Transaksi</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold">
              {displayedTxs.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab("ITEMS_SOLD")}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer ${
              activeMainTab === "ITEMS_SOLD"
                ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm font-black"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <span className="text-base">📦</span>
            <span>Item Terjual (Pcs)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold">
              {totalPcsSold} pcs
            </span>
          </button>
        </div>

        {/* =========================================================================
            KONTEN TAB 1: RIWAYAT TRANSAKSI KASIR
           ========================================================================= */}
        {activeMainTab === "TRANSACTIONS" && (
          <div className="space-y-3">
            {/* FLOATING ACTION BAR SAAT TRANSAKSI DIPILIH */}
            {selectedTxIds.length > 0 && (
              <div className="sticky top-16 sm:top-20 z-30 flex items-center justify-between gap-2 rounded-2xl bg-blue-600 px-3 sm:px-5 py-2.5 sm:py-3 text-white shadow-xl shadow-blue-600/30 animate-fadeIn border border-blue-500/30">
                <div className="flex items-center gap-2 shrink-0">
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
                    className="rounded-xl bg-blue-700/60 hover:bg-blue-700 border border-blue-400/30 px-2.5 py-1.5 text-xs font-bold text-white transition active:scale-95 cursor-pointer whitespace-nowrap"
                  >
                    Batal
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsBulkDeleting(true)}
                    className="hidden sm:inline-flex items-center gap-1 rounded-xl bg-rose-600 hover:bg-rose-700 border border-rose-400 px-3 py-1.5 text-xs font-bold text-white shadow-md transition active:scale-95 cursor-pointer whitespace-nowrap"
                    title="Hapus transaksi terpilih (Khusus Laptop)"
                  >
                    <span>🗑️</span>
                    <span>Hapus ({selectedTxIds.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleBulkPrint}
                    className="rounded-xl bg-white hover:bg-blue-50 px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-bold text-blue-600 shadow-md transition active:scale-95 cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
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

                {/* FILTER METODE PEMBAYARAN */}
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

              {/* TAMPILAN MOBILE (KARTU STRUK) */}
              <div className="sm:hidden divide-y divide-blue-50 dark:divide-slate-800 p-2 space-y-2">
                {paginatedTxs.map((tx) => {
                  const isSelected = selectedTxIds.includes(tx.id);
                  return (
                    <div
                      key={tx.id}
                      onTouchStart={() => handleTouchStart(tx.id)}
                      onTouchEnd={handleTouchEnd}
                      onClick={() => selectedTxIds.length > 0 && toggleSelectTx(tx.id)}
                      className={`p-2.5 rounded-xl space-y-2 border transition cursor-pointer select-none ${
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
                              <strong className="text-blue-600 dark:text-blue-400 font-semibold">
                                {i.quantity}x
                              </strong>{" "}
                              {i.menuItem.name}
                            </span>
                            <span className="text-slate-500 font-medium shrink-0">
                              {formatIDR(i.menuItem.price * i.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-blue-100 dark:border-slate-800 text-[10px]">
                        <span className="text-slate-400">
                          🕒{" "}
                          {new Date(tx.timestamp).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          WIB
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

              {/* TAMPILAN TABLE DESKTOP / LAPTOP */}
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
                      <th className="px-4 py-3.5 text-center w-24">AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-50 dark:divide-slate-800">
                    {paginatedTxs.map((tx) => {
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
                                  <span className="font-semibold text-blue-600">{i.quantity}x</span> {i.menuItem.name}
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
                          <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                            {statusTab === "ACTIVE" ? (
                              <button
                                type="button"
                                onClick={() => setTxToDelete(tx)}
                                className="inline-flex items-center gap-1 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 px-2.5 py-1 text-xs font-bold transition active:scale-95 cursor-pointer shadow-xs"
                                title="Batalkan / Soft Delete Transaksi"
                              >
                                <span>Hapus</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={restoringTxId === tx.id}
                                onClick={() => handleRestoreSingle(tx.id)}
                                className="inline-flex items-center gap-1 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 text-xs font-bold transition active:scale-95 cursor-pointer shadow-xs"
                              >
                                <span>🔄</span>
                                <span>{restoringTxId === tx.id ? "..." : "Pulihkan"}</span>
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
                <div className="p-8 text-center text-xs text-slate-500">
                  {statusTab === "ACTIVE"
                    ? "Belum ada transaksi aktif untuk rentang tanggal ini."
                    : "Tidak ada transaksi yang dibatalkan untuk rentang tanggal ini."}
                </div>
              )}

              {/* PAGINATION TRANSAKSI */}
              {displayedTxs.length > 0 && (
                <Pagination
                  currentPage={txPage}
                  totalPages={totalTxPages}
                  totalItems={displayedTxs.length}
                  itemsPerPage={txsPerPage}
                  onPageChange={setTxPage}
                  onItemsPerPageChange={setTxsPerPage}
                  itemName="transaksi"
                />
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            KONTEN TAB 2: REKAP ITEM TERJUAL (BERAPA PCS / QTY TERJUAL PER MENU)
            -> Fitur yang diminta user: Check berapa pcs terjual per item harian, bulanan & bydate
           ========================================================================= */}
        {activeMainTab === "ITEMS_SOLD" && (
          <div className="space-y-3">
            {/* KONTROL PENCARIAN, KATEGORI & SORTING ITEM TERJUAL */}
            <div className="rounded-2xl bg-white dark:bg-slate-900 p-3 sm:p-3.5 shadow-sm border border-blue-100 dark:border-slate-800 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                {/* Filter Kategori Menu */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
                  {["Semua", "Minuman", "Makanan Ringan", "Makanan Berat"].map((cat) => {
                    const isActive = itemCategoryFilter === cat;
                    const count =
                      cat === "Semua"
                        ? itemSalesList.length
                        : itemSalesList.filter((i) => i.category === cat).length;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setItemCategoryFilter(cat)}
                        className={`rounded-xl px-2.5 py-1 text-xs font-bold whitespace-nowrap transition cursor-pointer shrink-0 flex items-center gap-1 ${
                          isActive
                            ? "bg-amber-600 text-white shadow-sm"
                            : "bg-sky-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-blue-100 dark:border-transparent hover:bg-blue-100/60"
                        }`}
                      >
                        <span>{cat}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                            isActive
                              ? "bg-white/20 text-white"
                              : "bg-amber-100 text-amber-800 dark:bg-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Urutkan Berdasarkan & Pencarian */}
                <div className="flex items-center gap-2">
                  <div className="relative w-full sm:w-56">
                    <input
                      type="text"
                      value={itemSearch}
                      onChange={(e) => setItemSearch(e.target.value)}
                      placeholder="Cari menu terjual..."
                      className="w-full rounded-xl border border-blue-200 dark:border-slate-800 bg-sky-50/40 dark:bg-slate-800/60 pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                    />
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                      🔍
                    </span>
                    {itemSearch && (
                      <button
                        type="button"
                        onClick={() => setItemSearch("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <select
                    value={itemSortBy}
                    onChange={(e: any) => setItemSortBy(e.target.value)}
                    className="shrink-0 rounded-xl border border-blue-200 dark:border-slate-800 bg-sky-50/40 dark:bg-slate-800/60 px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
                  >
                    <option value="terlaris">🔥 Terlaris (Qty Pcs)</option>
                    <option value="omzet">💰 Omzet Tertinggi</option>
                    <option value="terendah">📉 Paling Sedikit</option>
                    <option value="nama">🔤 Nama (A-Z)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* TABEL REKAP ITEM TERJUAL */}
            <div className="overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-blue-100 dark:border-slate-800">
              <div className="p-3 bg-amber-50/40 dark:bg-slate-800/40 border-b border-amber-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">📋</span>
                  <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                    Tabel Penjualan Menu ({reportTitleLabel})
                  </span>
                </div>
                <div className="text-xs font-bold text-amber-700 dark:text-amber-400">
                  Total Terjual: <strong>{totalPcsSold} pcs</strong>
                </div>
              </div>

              {/* TAMPILAN KHUSUS HP (KARTU MENU TERJUAL DENGAN RANKING & PCS JELAS) */}
              <div className="sm:hidden divide-y divide-blue-50 dark:divide-slate-800 p-2 space-y-2">
                {paginatedItemSales.map((item, index) => {
                  const rank = (itemPage - 1) * itemsPerPage + index + 1;
                  return (
                    <div
                      key={item.menuId}
                      className="p-3 rounded-xl bg-sky-50/20 dark:bg-slate-800/40 border border-blue-100/60 dark:border-slate-800 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {/* Badge Peringkat */}
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-black shadow-xs ${
                              rank === 1
                                ? "bg-amber-400 text-amber-950 font-black ring-2 ring-amber-300"
                                : rank === 2
                                ? "bg-slate-300 text-slate-800 font-bold"
                                : rank === 3
                                ? "bg-amber-700 text-white font-bold"
                                : "bg-blue-100 text-blue-700 dark:bg-slate-700 dark:text-slate-300"
                            }`}
                          >
                            {rank}
                          </span>
                          <div className="min-w-0">
                            <span className="text-[9px] font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-1.5 py-0.2 rounded border border-blue-100 dark:border-transparent inline-block">
                              {item.category}
                            </span>
                            <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                              {item.name}
                            </h3>
                          </div>
                        </div>

                        {/* BADGE BESAR JUMLAH PCS TERJUAL (FOKUS UTAMA USER) */}
                        <div className="text-right shrink-0">
                          <span className="inline-block rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-2.5 py-1 text-xs font-black text-white shadow-sm shadow-amber-500/20">
                            {item.totalQty} pcs
                          </span>
                        </div>
                      </div>

                      {/* Rincian Finansial Menu */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] bg-white/80 dark:bg-slate-900/60 p-2 rounded-xl border border-blue-50 dark:border-slate-800">
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase font-semibold">Harga Satuan</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {formatIDR(item.unitPrice)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-400 block text-[9px] uppercase font-semibold">Total Omzet</span>
                          <span className="font-black text-blue-600 dark:text-blue-400">
                            {formatIDR(item.totalRevenue)}
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar Kontribusi Penjualan */}
                      <div className="pt-1 space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                          <span>Kontribusi Terjual: <strong>{item.percentage}%</strong></span>
                          <span>Muncul di <strong>{item.orderCount}</strong> struk</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            style={{ width: `${Math.min(item.percentage, 100)}%` }}
                            className="h-full bg-amber-500 rounded-full transition-all duration-300"
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* TAMPILAN TABLE DESKTOP / TABLET */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                  <thead className="bg-sky-50/40 dark:bg-slate-800/40 text-xs uppercase text-slate-500 font-semibold border-b border-blue-100 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3.5 text-center w-12">NO</th>
                      <th className="px-6 py-3.5">NAMA MENU</th>
                      <th className="px-4 py-3.5">KATEGORI</th>
                      <th className="px-4 py-3.5 text-right">HARGA SATUAN</th>
                      <th className="px-6 py-3.5 text-center">JUMLAH TERJUAL (PCS)</th>
                      <th className="px-6 py-3.5 text-right">TOTAL OMZET</th>
                      <th className="px-4 py-3.5 text-center">KONTRIBUSI</th>
                      <th className="px-4 py-3.5 text-center">FREKUENSI STRUK</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-50 dark:divide-slate-800">
                    {paginatedItemSales.map((item, index) => {
                      const rank = (itemPage - 1) * itemsPerPage + index + 1;
                      return (
                        <tr
                          key={item.menuId}
                          className="hover:bg-blue-50/30 dark:hover:bg-slate-800/40 transition"
                        >
                          <td className="px-4 py-4 text-center">
                            <span
                              className={`inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black ${
                                rank === 1
                                  ? "bg-amber-400 text-amber-950 ring-2 ring-amber-300"
                                  : rank === 2
                                  ? "bg-slate-300 text-slate-800"
                                  : rank === 3
                                  ? "bg-amber-700 text-white"
                                  : "bg-blue-100 text-blue-700 dark:bg-slate-800 dark:text-slate-300"
                              }`}
                            >
                              {rank}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900 dark:text-white">
                              {item.name}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="rounded-full bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                              {item.category}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right font-medium">
                            {formatIDR(item.unitPrice)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center gap-1 rounded-xl bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-3 py-1 text-xs font-black">
                              🔥 {item.totalQty} pcs
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-black text-slate-900 dark:text-white">
                            {formatIDR(item.totalRevenue)}
                          </td>
                          <td className="px-4 py-4 text-center font-bold text-slate-600 dark:text-slate-300">
                            {item.percentage}%
                          </td>
                          <td className="px-4 py-4 text-center text-xs text-slate-500">
                            {item.orderCount} struk
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {filteredItemSales.length === 0 && (
                <div className="p-8 text-center text-xs text-slate-500">
                  Tidak ada menu yang terjual pada rentang tanggal ini.
                </div>
              )}

              {/* PAGINATION ITEM TERJUAL */}
              {filteredItemSales.length > 0 && (
                <Pagination
                  currentPage={itemPage}
                  totalPages={totalItemPages}
                  totalItems={filteredItemSales.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setItemPage}
                  onItemsPerPageChange={setItemsPerPage}
                  itemName="menu terjual"
                />
              )}
            </div>
          </div>
        )}
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
                  {txToDelete.date} •{" "}
                  {new Date(txToDelete.timestamp).toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  WIB
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
              ℹ️ <strong>Soft Delete:</strong> Data transaksi tidak dihapus dari database. Statusnya diubah menjadi{" "}
              <strong>CANCELLED</strong> sehingga tidak dihitung dalam total omzet dan dapat dipulihkan sewaktu-waktu.
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