"use client";

import React, { useState, useMemo } from "react";
import { usePOS } from "@/context/POSContext";

const MONTHS = [
  { value: "01", label: "Januari" },
  { value: "02", label: "Februari" },
  { value: "03", label: "Maret" },
  { value: "04", label: "April" },
  { value: "05", label: "Mei" },
  { value: "06", label: "Juni" },
  { value: "07", label: "Juli" },
  { value: "08", label: "Agustus" },
  { value: "09", label: "September" },
  { value: "10", label: "Oktober" },
  { value: "11", label: "November" },
  { value: "12", label: "Desember" },
];

export const SalesHistory: React.FC = () => {
  const { transactions } = usePOS();
  const now = new Date();
  const currentYearStr = now.getFullYear().toString();
  const currentMonthStr = (now.getMonth() + 1).toString().padStart(2, "0");
  const currentDayStr = now.getDate().toString().padStart(2, "0");

  const [selectedYear, setSelectedYear] = useState<string>(currentYearStr);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [selectedDay, setSelectedDay] = useState<string>(currentDayStr);
  const [methodFilter, setMethodFilter] = useState<string>("Semua");

  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>(["2024", "2025", "2026", "2027", "2028"]);
    transactions.forEach((tx) => {
      if (tx.date) {
        const y = tx.date.split("-")[0];
        if (y) yearsSet.add(y);
      }
    });
    return Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
  }, [transactions]);

  const daysInMonth = useMemo(() => {
    const y = parseInt(selectedYear, 10);
    const m = parseInt(selectedMonth, 10);
    if (isNaN(y) || isNaN(m)) return 31;
    return new Date(y, m, 0).getDate();
  }, [selectedYear, selectedMonth]);

  const dayOptions = useMemo(() => {
    const days: { value: string; label: string }[] = [
      { value: "all", label: "Semua Tanggal (1 Bulan)" },
    ];
    for (let i = 1; i <= daysInMonth; i++) {
      const val = i.toString().padStart(2, "0");
      days.push({ value: val, label: `Tgl ${val}` });
    }
    return days;
  }, [daysInMonth]);

  const effectiveDay = useMemo(() => {
    if (selectedDay === "all") return "all";
    const num = parseInt(selectedDay, 10);
    if (num > daysInMonth) return "all";
    return selectedDay;
  }, [selectedDay, daysInMonth]);

  const isAllDays = effectiveDay === "all";

  const dateTxs = useMemo(() => {
    return transactions.filter((tx) => {
      if (isAllDays) {
        return tx.date.startsWith(`${selectedYear}-${selectedMonth}`);
      }
      return tx.date === `${selectedYear}-${selectedMonth}-${effectiveDay}`;
    });
  }, [transactions, selectedYear, selectedMonth, effectiveDay, isAllDays]);

  const filteredTx = useMemo(() => {
    return dateTxs.filter((tx) => {
      return methodFilter === "Semua" ? true : tx.paymentMethod === methodFilter;
    });
  }, [dateTxs, methodFilter]);

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

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);
  };

  const selectedMonthObj = MONTHS.find((m) => m.value === selectedMonth);
  const monthName = selectedMonthObj ? selectedMonthObj.label : selectedMonth;

  const reportTitleLabel = useMemo(() => {
    if (isAllDays) {
      return `Rekap: ${monthName} ${selectedYear}`;
    }
    try {
      const d = new Date(`${selectedYear}-${selectedMonth}-${effectiveDay}`);
      return d.toLocaleDateString("id-ID", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      return `${effectiveDay} ${monthName} ${selectedYear}`;
    }
  }, [isAllDays, monthName, selectedYear, effectiveDay, selectedMonth]);

  const handleSelectToday = () => {
    setSelectedYear(currentYearStr);
    setSelectedMonth(currentMonthStr);
    setSelectedDay(currentDayStr);
  };

  const handleSelectThisMonth = () => {
    setSelectedYear(currentYearStr);
    setSelectedMonth(currentMonthStr);
    setSelectedDay("all");
  };

  return (
    <div className="min-h-screen bg-[#F0F7FF] dark:bg-slate-950 pt-2 sm:pt-20 pb-2 lg:pb-16 text-slate-900 dark:text-slate-50 transition-colors duration-200">
      <div className="mx-auto max-w-7xl px-2 sm:px-4 lg:px-8 space-y-2.5 sm:space-y-4">
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
            <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
              <div>
                <label className="block text-[9px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-0.5 truncate">
                  📅 Tanggal
                </label>
                <select
                  value={effectiveDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className="w-full rounded-xl border border-blue-200/80 dark:border-slate-700 bg-sky-50/40 dark:bg-slate-800 px-1.5 sm:px-3 py-1.5 text-[10px] sm:text-xs font-semibold text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                >
                  {dayOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[9px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-0.5 truncate">
                  🗓 Bulan
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full rounded-xl border border-blue-200/80 dark:border-slate-700 bg-sky-50/40 dark:bg-slate-800 px-1.5 sm:px-3 py-1.5 text-[10px] sm:text-xs font-semibold text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                >
                  {MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[9px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-0.5 truncate">
                  📆 Tahun
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full rounded-xl border border-blue-200/80 dark:border-slate-700 bg-sky-50/40 dark:bg-slate-800 px-1.5 sm:px-3 py-1.5 text-[10px] sm:text-xs font-semibold text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                >
                  {availableYears.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 text-[11px] sm:text-xs font-bold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 shadow-sm">
          <span>📅</span> {reportTitleLabel}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3.5">
          <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-sky-600 p-3 sm:p-4 text-white shadow-md shadow-blue-500/20 col-span-2 sm:col-span-1">
            <span className="text-[9px] sm:text-xs font-medium text-blue-100 uppercase tracking-wider block">
              Total Pemasukan
            </span>
            <div className="text-lg sm:text-2xl font-black mt-0.5 tracking-tight truncate">
              {formatIDR(totalRevenue)}
            </div>
            <p className="text-[9px] sm:text-[11px] text-blue-100">
              Semua metode bayar
            </p>
          </div>

          <div className="rounded-2xl bg-white dark:bg-slate-900 p-3 sm:p-4 border border-blue-100 dark:border-slate-800 shadow-sm">
            <span className="text-[9px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider block truncate">
              Total Transaksi
            </span>
            <div className="text-base sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {totalTransactions} <span className="text-[10px] sm:text-xs font-medium text-slate-400">struk</span>
            </div>
            <p className="text-[9px] text-slate-400">Pelanggan dilayani</p>
          </div>

          <div className="rounded-2xl bg-white dark:bg-slate-900 p-3 sm:p-4 border border-emerald-200 dark:border-emerald-900/60 shadow-sm">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[9px] sm:text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider truncate">
                💵 Cash
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

        <div className="overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-blue-100 dark:border-slate-800">
          <div className="p-2.5 sm:p-4 bg-sky-50/50 dark:bg-slate-800/50 border-b border-blue-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
              Daftar Transaksi ({filteredTx.length})
            </h3>
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

          <div className="sm:hidden divide-y divide-blue-50 dark:divide-slate-800 p-1.5 space-y-1.5">
            {filteredTx.map((tx) => (
              <div key={tx.id} className="p-2.5 bg-sky-50/30 dark:bg-slate-800/40 rounded-xl space-y-1.5 border border-blue-100/60 dark:border-slate-800">
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-600 font-black text-[10px] text-white shadow-sm">
                      {tx.queueNumber}
                    </span>
                    <div className="min-w-0">
                      <span className="font-mono text-[10px] text-slate-600 dark:text-slate-400 font-bold block truncate">{tx.id}</span>
                      <span className="text-[9px] text-slate-400 block">{tx.date}</span>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                      tx.paymentMethod === "Cash"
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
                      <span className="truncate">{i.quantity}x {i.menuItem.name}</span>
                      <span className="text-slate-400 shrink-0">{formatIDR(i.menuItem.price * i.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-blue-100 dark:border-slate-700 text-[10px]">
                  <span className="text-slate-400">
                    {new Date(tx.timestamp).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                  </span>
                  <span className="text-xs font-black text-blue-600 dark:text-blue-400">
                    {formatIDR(tx.total)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-sky-50/40 dark:bg-slate-800/20 text-xs uppercase text-slate-400 font-semibold border-b border-blue-100 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Antrean</th>
                  <th className="px-6 py-3.5">No. Transaksi</th>
                  <th className="px-6 py-3.5">Tanggal &amp; Waktu</th>
                  <th className="px-6 py-3.5">Rincian Item</th>
                  <th className="px-6 py-3.5">Metode</th>
                  <th className="px-6 py-3.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-50 dark:divide-slate-800">
                {filteredTx.map((tx) => (
                  <tr key={tx.id} className="hover:bg-blue-50/30 dark:hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/60 font-black text-xs text-blue-700 dark:text-blue-300">
                        {tx.queueNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500 font-semibold">
                      {tx.id}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <div>{tx.date}</div>
                      <div className="text-slate-400">
                        {new Date(tx.timestamp).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })} WIB
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
                    <td className="px-6 py-4">
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
                    <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white">
                      {formatIDR(tx.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredTx.length === 0 && (
            <div className="p-6 text-center text-xs text-slate-500">
              Belum ada transaksi tercatat untuk periode ini.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
