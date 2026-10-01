"use client";

import React, { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import { usePOS } from "@/context/POSContext";

interface ExpenseItem {
    id: string;
    title: string;
    amount: number;
    category: string;
    notes?: string;
    expenseDate: string;
}

interface FinancialSummary {
    totalRevenue: number;
    totalCash: number;
    totalQris: number;
    totalExpense: number;
    netProfit: number;
}

export const ExpenseManagement: React.FC = () => {
    const { transactions, menuList } = usePOS();

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
    const [startDate, setStartDate] = useState<string>(getFirstDayOfMonth());
    const [endDate, setEndDate] = useState<string>(getTodayStr());

    // State Data Finansial
    const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
    const [summary, setSummary] = useState<FinancialSummary>({
        totalRevenue: 0,
        totalCash: 0,
        totalQris: 0,
        totalExpense: 0,
        netProfit: 0,
    });
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // State Modal Tambah Pengeluaran
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [title, setTitle] = useState<string>("");
    const [amount, setAmount] = useState<string>("");
    const [category, setCategory] = useState<string>("Bahan Baku");
    const [expenseDate, setExpenseDate] = useState<string>(getTodayStr());
    const [notes, setNotes] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const formatIDR = (val: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(val);
    };

    // KALKULASI RUMUS HPP MENU: (Harga Jual - HPP = Total Keuntungan Menu)
    const hppSummary = useMemo(() => {
        const targetTxs = transactions.filter((tx) => {
            if (!tx.date) return false;
            const matchStart = startDate ? tx.date >= startDate : true;
            const matchEnd = endDate ? tx.date <= endDate : true;
            return matchStart && matchEnd;
        });

        let totalSales = 0;
        let totalHpp = 0;

        targetTxs.forEach((tx) => {
            tx.items.forEach((item) => {
                const qty = item.quantity;
                const price = item.menuItem.price;

                // Ambil HPP dari item atau dari menu aktif di database
                const liveMenu = menuList.find(
                    (m) =>
                        m.id === item.menuItem.id ||
                        m.name.toLowerCase() === item.menuItem.name.toLowerCase()
                );
                const hppVal = item.menuItem.hpp ?? liveMenu?.hpp ?? 0;

                totalSales += price * qty;
                totalHpp += hppVal * qty;
            });
        });

        const totalKeuntungan = totalSales - totalHpp;

        return {
            totalSales,
            totalHpp,
            totalKeuntungan,
        };
    }, [transactions, menuList, startDate, endDate]);

    // Fetch data pengeluaran dan ringkasan finansial dari API
    const fetchExpenses = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/expenses?startDate=${startDate}&endDate=${endDate}`);
            const json = await res.json();
            if (json.success && json.data) {
                setExpenses(json.data.expenses);
                setSummary(json.data.summary);
            }
        } catch (err) {
            console.error(err);
            toast.error("Gagal memuat data pengeluaran");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchExpenses();
    }, [startDate, endDate]);

    // Tombol Shortcut Tanggal
    const handleShortcutToday = () => {
        const today = getTodayStr();
        setStartDate(today);
        setEndDate(today);
    };

    const handleShortcutThisMonth = () => {
        setStartDate(getFirstDayOfMonth());
        setEndDate(getTodayStr());
    };

    // Handle Simpan Pengeluaran Baru
    const handleSubmitExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        const numAmount = parseInt(amount.replace(/\D/g, ""), 10);
        if (!title || !numAmount || numAmount <= 0) {
            toast.error("Nama biaya dan nominal wajib diisi!");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/expenses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    amount: numAmount,
                    category,
                    expenseDate,
                    notes,
                }),
            });

            if (res.ok) {
                toast.success("Pengeluaran berhasil dicatat!");
                setIsModalOpen(false);
                setTitle("");
                setAmount("");
                setNotes("");
                setExpenseDate(getTodayStr());
                fetchExpenses();
            } else {
                throw new Error("Gagal menyimpan ke server");
            }
        } catch (err: any) {
            toast.error(err.message || "Gagal mencatat pengeluaran");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F0F7FF] dark:bg-slate-950 pt-2 sm:pt-20 pb-32 text-slate-900 dark:text-slate-50 transition-colors duration-200 overflow-x-hidden">
            <div className="mx-auto max-w-7xl px-2.5 sm:px-4 lg:px-8 space-y-2.5 sm:space-y-4">
                {/* HEADER & DATE RANGE FILTER (RAPI 100% DI 320PX) */}
                <div className="rounded-2xl bg-white dark:bg-slate-900 p-3 sm:p-4 shadow-sm border border-blue-100 dark:border-slate-800 space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                            <div className="flex items-center gap-1.5 sm:gap-2">
                                <span className="text-lg sm:text-2xl">💸</span>
                                <h1 className="text-xs sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                                    Laporan Pengeluaran &amp; Laba Bersih
                                </h1>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                                Kalkulasi otomatis laba bersih toko dari penjualan dikurangi biaya operasional.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsModalOpen(true)}
                            className="w-full sm:w-auto rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-blue-600/30 hover:bg-blue-700 transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                        >
                            <span>+</span> Catat Pengeluaran
                        </button>
                    </div>

                    {/* FILTER SHORTCUT & DATE PICKER RESPONSIF */}
                    <div className="pt-2 border-t border-blue-50 dark:border-slate-800 space-y-2">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[9px] sm:text-[11px] font-bold text-slate-500 uppercase">
                                SHORTCUT:
                            </span>
                            <button
                                type="button"
                                onClick={handleShortcutToday}
                                className="rounded-lg border border-blue-200 bg-blue-50/80 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-xs font-bold text-blue-700 hover:bg-blue-100 transition cursor-pointer"
                            >
                                Hari Ini
                            </button>
                            <button
                                type="button"
                                onClick={handleShortcutThisMonth}
                                className="rounded-lg border border-blue-200 bg-blue-50/80 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-xs font-bold text-blue-700 hover:bg-blue-100 transition cursor-pointer"
                            >
                                Bulan Ini
                            </button>
                        </div>

                        {/* INPUT TANGGAL RESPONSIF (TIDAK AKAN TERCROP DI 320PX) */}
                        <div className="grid grid-cols-2 gap-1.5 sm:flex sm:items-center sm:gap-2">
                            <div className="w-full sm:w-auto">
                                <label className="block text-[8px] sm:hidden font-bold uppercase text-slate-400 mb-0.5">
                                    Dari Tanggal
                                </label>
                                <div className="flex items-center gap-1 rounded-xl border border-blue-200/80 dark:border-slate-700 bg-sky-50/40 dark:bg-slate-800 px-2 py-1 text-xs">
                                    <span className="hidden sm:inline text-slate-400 font-semibold text-[11px]">Dari:</span>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full bg-transparent font-bold text-slate-800 dark:text-white focus:outline-none cursor-pointer text-[10px] sm:text-xs"
                                    />
                                </div>
                            </div>

                            <div className="w-full sm:w-auto">
                                <label className="block text-[8px] sm:hidden font-bold uppercase text-slate-400 mb-0.5">
                                    Sampai Tanggal
                                </label>
                                <div className="flex items-center gap-1 rounded-xl border border-blue-200/80 dark:border-slate-700 bg-sky-50/40 dark:bg-slate-800 px-2 py-1 text-xs">
                                    <span className="hidden sm:inline text-slate-400 font-semibold text-[11px]">s/d:</span>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full bg-transparent font-bold text-slate-800 dark:text-white focus:outline-none cursor-pointer text-[10px] sm:text-xs"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* FINANCIAL SUMMARY CARDS DENGAN RUMUS HPP MENU & LABA BERSIH */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                    {/* Card 1: Total Pengeluaran */}
                    <div className="rounded-2xl bg-white dark:bg-slate-900 p-3 sm:p-4 border border-rose-200 dark:border-rose-900/60 shadow-sm">
                        <span className="text-[9px] sm:text-xs font-bold text-rose-500 uppercase tracking-wider block">
                            TOTAL PENGELUARAN
                        </span>
                        <div className="text-base sm:text-2xl font-black text-rose-600 mt-0.5 truncate">
                            {formatIDR(summary.totalExpense)}
                        </div>
                        <p className="text-[9px] text-slate-400 mt-0.5">Biaya operasional &amp; belanja toko</p>
                    </div>

                    {/* Card 2: Total Omzet Penjualan */}
                    <div className="rounded-2xl bg-white dark:bg-slate-900 p-3 sm:p-4 border border-emerald-200 dark:border-emerald-900/60 shadow-sm">
                        <span className="text-[9px] sm:text-xs font-bold text-emerald-600 uppercase tracking-wider block">
                            TOTAL OMZET PENJUALAN
                        </span>
                        <div className="text-base sm:text-2xl font-black text-emerald-600 mt-0.5 truncate">
                            {formatIDR(summary.totalRevenue)}
                        </div>
                        <p className="text-[9px] text-slate-400 mt-0.5">
                            Cash: {formatIDR(summary.totalCash)} | QRIS: {formatIDR(summary.totalQris)}
                        </p>
                    </div>

                    {/* Card 3 (BARU): RUMUS HPP (Harga Jual - HPP = Total Keuntungan Menu) */}
                    {/* <div className="rounded-2xl bg-white dark:bg-slate-900 p-3 sm:p-4 border border-blue-200 dark:border-blue-900/60 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] sm:text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                                LABA KOTOR MENU
                            </span>
                            <span className="text-[8px] sm:text-[9px] font-bold text-blue-700 bg-blue-50 dark:bg-blue-950 px-1.5 py-0.5 rounded-full">
                                Harga Jual - HPP
                            </span>
                        </div>
                        <div className="text-base sm:text-2xl font-black text-blue-600 dark:text-blue-400 mt-0.5 truncate">
                            {formatIDR(hppSummary.totalKeuntungan)}
                        </div>
                        <div className="text-[9px] text-slate-500 dark:text-slate-400 mt-1 pt-1 border-t border-blue-100 dark:border-slate-800 space-y-0.5">
                            <div className="flex justify-between">
                                <span>Total Harga Jual:</span>
                                <span className="font-bold text-slate-700 dark:text-slate-300">
                                    {formatIDR(hppSummary.totalSales)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Total HPP Bahan:</span>
                                <span className="font-bold text-slate-700 dark:text-slate-300">
                                    - {formatIDR(hppSummary.totalHpp)}
                                </span>
                            </div>
                        </div>
                    </div> */}

                    {/* Card 4: Keuntungan Bersih (Net Profit) */}
                    <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-sky-600 p-3 sm:p-4 text-white shadow-lg shadow-blue-500/20 flex flex-col justify-between">
                        <div>
                            <span className="text-[9px] sm:text-xs font-semibold uppercase tracking-wider text-blue-100 block">
                                KEUNTUNGAN BERSIH (NET PROFIT)
                            </span>
                            <div className="text-lg sm:text-2xl font-black mt-0.5 tracking-tight truncate">
                                {formatIDR(summary.netProfit)}
                            </div>
                        </div>
                        <div className="mt-2 pt-1 border-t border-white/20 text-[9px] text-blue-100 font-mono">
                            <p className="font-bold">
                                Rumus: (Cash + QRIS) - Total Pengeluaran
                            </p>
                        </div>
                    </div>
                </div>

                {/* TABEL / DAFTAR CATATAN PENGELUARAN */}
                <div className="overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-blue-100 dark:border-slate-800">
                    <div className="p-2.5 sm:p-3.5 bg-sky-50/50 dark:bg-slate-800/50 border-b border-blue-100 dark:border-slate-800 flex items-center justify-between">
                        <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                            Daftar Catatan Pengeluaran ({expenses.length})
                        </h3>
                        {isLoading && (
                            <span className="text-[10px] text-blue-600 font-semibold animate-pulse">
                                Memuat data...
                            </span>
                        )}
                    </div>

                    {/* TAMPILAN MOBILE (KARTU INDIVIDUAL: NAMA BIAYA & KETERANGAN DIPISAH PAS 320PX) */}
                    <div className="sm:hidden divide-y divide-blue-50 dark:divide-slate-800 p-2 space-y-2">
                        {expenses.map((exp) => (
                            <div
                                key={exp.id}
                                className="p-2.5 bg-sky-50/30 dark:bg-slate-800/40 rounded-xl space-y-1.5 border border-blue-100/60 dark:border-slate-800 text-xs"
                            >
                                {/* Tanggal & Kategori */}
                                <div className="flex items-center justify-between gap-1 text-[10px]">
                                    <span className="font-mono text-slate-500 dark:text-slate-400 font-semibold">
                                        📅 {new Date(exp.expenseDate).toLocaleDateString("id-ID", {
                                            day: "2-digit",
                                            month: "short",
                                            year: "numeric",
                                        })}
                                    </span>
                                    <span className="rounded-full bg-blue-50 dark:bg-blue-950 px-2 py-0.5 font-bold text-blue-700 dark:text-blue-300">
                                        {exp.category}
                                    </span>
                                </div>

                                {/* 1. NAMA BIAYA (DIPISAH TEGAS) */}
                                <div className="pt-0.5">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                                        Nama Biaya:
                                    </span>
                                    <p className="font-bold text-slate-900 dark:text-white text-xs leading-snug break-words">
                                        {exp.title}
                                    </p>
                                </div>

                                {/* 2. KETERANGAN (DIPISAH DI KOTAK SENDIRI) */}
                                {exp.notes ? (
                                    <div className="bg-white/70 dark:bg-slate-900/60 p-1.5 rounded-lg border border-blue-50 dark:border-slate-800">
                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">
                                            Keterangan:
                                        </span>
                                        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-tight break-words">
                                            {exp.notes}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="text-[10px] text-slate-400 italic">
                                        Keterangan: -
                                    </div>
                                )}

                                {/* Nominal */}
                                <div className="flex items-center justify-between pt-1 border-t border-blue-100/60 dark:border-slate-800 text-[10px]">
                                    <span className="text-slate-400 font-semibold">Nominal:</span>
                                    <span className="font-black text-xs text-rose-600 dark:text-rose-400">
                                        {formatIDR(exp.amount)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* TAMPILAN TABLE DESKTOP / TABLET (KOLOM NAMA BIAYA & KETERANGAN DIPISAH) */}
                    <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                            <thead className="bg-sky-50/30 dark:bg-slate-800/40 text-[10px] uppercase text-slate-400 font-bold border-b border-blue-100 dark:border-slate-800">
                                <tr>
                                    <th className="px-4 py-3">TANGGAL</th>
                                    <th className="px-4 py-3">KATEGORI</th>
                                    <th className="px-5 py-3">NAMA BIAYA</th>
                                    <th className="px-5 py-3">KETERANGAN</th>
                                    <th className="px-4 py-3 text-right">NOMINAL</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-blue-50 dark:divide-slate-800">
                                {expenses.map((exp) => (
                                    <tr key={exp.id} className="hover:bg-blue-50/30 transition">
                                        <td className="px-4 py-3 font-mono text-xs text-slate-500 whitespace-nowrap">
                                            {new Date(exp.expenseDate).toLocaleDateString("id-ID", {
                                                day: "2-digit",
                                                month: "short",
                                                year: "numeric",
                                            })}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="rounded-full bg-blue-50 dark:bg-blue-950 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300">
                                                {exp.category}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 font-bold text-slate-900 dark:text-white">
                                            {exp.title}
                                        </td>
                                        <td className="px-5 py-3 text-xs text-slate-500 dark:text-slate-400">
                                            {exp.notes || "-"}
                                        </td>
                                        <td className="px-4 py-3 text-right font-black text-rose-600 dark:text-rose-400 whitespace-nowrap">
                                            {formatIDR(exp.amount)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {expenses.length === 0 && !isLoading && (
                        <div className="p-8 text-center text-xs text-slate-400">
                            Belum ada catatan pengeluaran pada rentang tanggal yang dipilih.
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL INPUT PENGELUARAN */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-2 sm:p-4 backdrop-blur-sm animate-fadeIn">
                    <div className="w-full max-w-md max-h-[92vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-2xl border border-blue-100 dark:border-slate-800 text-slate-800 dark:text-white">
                        <div className="flex items-center justify-between border-b border-blue-50 dark:border-slate-800 pb-2.5 mb-3.5">
                            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                                Catat Pengeluaran Toko
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmitExpense} className="space-y-3">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                                    Nama Biaya *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: Beli Susu Segar & Gula Aren"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full rounded-xl border border-blue-200 dark:border-slate-700 bg-sky-50/30 dark:bg-slate-800 px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                                        Nominal (Rp) *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        placeholder="Contoh: 125000"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-full rounded-xl border border-blue-200 dark:border-slate-700 bg-sky-50/30 dark:bg-slate-800 px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                                        Kategori
                                    </label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full rounded-xl border border-blue-200 dark:border-slate-700 bg-sky-50/30 dark:bg-slate-800 px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none cursor-pointer"
                                    >
                                        <option value="Bahan Baku">Bahan Baku</option>
                                        <option value="Operasional">Operasional</option>
                                        <option value="Gaji / Upah">Gaji / Upah</option>
                                        <option value="Listrik & Air">Listrik &amp; Air</option>
                                        <option value="Lainnya">Lainnya</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                                    Tanggal Pengeluaran
                                </label>
                                <input
                                    type="date"
                                    value={expenseDate}
                                    onChange={(e) => setExpenseDate(e.target.value)}
                                    className="w-full rounded-xl border border-blue-200 dark:border-slate-700 bg-sky-50/30 dark:bg-slate-800 px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none cursor-pointer"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                                    Keterangan (Opsional)
                                </label>
                                <textarea
                                    rows={2}
                                    placeholder="Catatan rincian biaya atau nama supplier..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="w-full rounded-xl border border-blue-200 dark:border-slate-700 bg-sky-50/30 dark:bg-slate-800 px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="rounded-xl bg-slate-100 dark:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-blue-600/30 hover:bg-blue-700 transition cursor-pointer"
                                >
                                    {isSubmitting ? "Menyimpan..." : "Simpan Pengeluaran"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};