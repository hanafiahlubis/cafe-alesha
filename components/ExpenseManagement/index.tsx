"use client";

import React, { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import { usePOS } from "@/context/POSContext";
import { ExpenseItem, DeletedExpenseItem, ExpensePaymentMethod } from "@/types/pos";

interface FinancialSummary {
    totalRevenue: number;
    totalCash: number;
    totalQris: number;
    totalExpense: number;
    totalCashExpense?: number;
    totalQrisExpense?: number;
    netProfit: number;
}

interface BalanceItem {
    id?: string;
    type: "CASH" | "QRIS";
    actualAmount: number;
    initialAmount?: number;
    calculatedEndingBalance?: number;
    note?: string | null;
    updatedAt?: string;
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
        totalCashExpense: 0,
        totalQrisExpense: 0,
        netProfit: 0,
    });
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // FITUR 1: State Saldo Awal & Saldo Akhir Kas & Bank QRIS
    const [cashBalance, setCashBalance] = useState<BalanceItem | null>(null);
    const [qrisBalance, setQrisBalance] = useState<BalanceItem | null>(null);

    // State Modal Edit Saldo Awal & Akhir
    const [isBalanceModalOpen, setIsBalanceModalOpen] = useState<boolean>(false);
    const [editingType, setEditingType] = useState<"CASH" | "QRIS">("CASH");
    const [initialBalanceInput, setInitialBalanceInput] = useState<string>("");
    const [balanceNoteInput, setBalanceNoteInput] = useState<string>("");
    const [isSavingBalance, setIsSavingBalance] = useState<boolean>(false);

    // FITUR 2: State Modal Tambah Pengeluaran Toko
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [title, setTitle] = useState<string>("");
    const [category, setCategory] = useState<string>("Bahan Baku");
    const [paymentMethod, setPaymentMethod] = useState<ExpensePaymentMethod>("CASH");
    const [singleAmount, setSingleAmount] = useState<string>("");
    const [splitCashAmount, setSplitCashAmount] = useState<string>("");
    const [splitQrisAmount, setSplitQrisAmount] = useState<string>("");
    const [expenseDate, setExpenseDate] = useState<string>(getTodayStr());
    const [notes, setNotes] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    // FITUR 3: State Modal Konfirmasi Hapus Satuan & Hapus Semua
    const [itemToDelete, setItemToDelete] = useState<ExpenseItem | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
    const [isDeletingItem, setIsDeletingItem] = useState<boolean>(false);

    const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState<boolean>(false);
    const [isDeletingAll, setIsDeletingAll] = useState<boolean>(false);

    // FITUR 4: State Riwayat Pengeluaran Dihapus (Audit Log)
    const [deletedExpenses, setDeletedExpenses] = useState<DeletedExpenseItem[]>([]);
    const [isLoadingDeleted, setIsLoadingDeleted] = useState<boolean>(false);
    const [showDeletedHistory, setShowDeletedHistory] = useState<boolean>(true);
    const [restoringId, setRestoringId] = useState<string | null>(null);

    const formatIDR = (val: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(val || 0);
    };

    const formatDateTime = (dateStr?: string) => {
        if (!dateStr) return "Belum disesuaikan";
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

    // Kalkulasi Total Pengeluaran Berdasarkan Sumber Dana (Cash vs QRIS)
    const { totalCashExpenses, totalQrisExpenses } = useMemo(() => {
        let cashSum = 0;
        let qrisSum = 0;

        expenses.forEach((exp) => {
            const method = exp.paymentMethod || "CASH";
            if (method === "CASH") {
                cashSum += exp.amount;
            } else if (method === "QRIS") {
                qrisSum += exp.amount;
            } else if (method === "SPLIT") {
                cashSum += exp.cashAmount ?? 0;
                qrisSum += exp.qrisAmount ?? 0;
            }
        });

        return {
            totalCashExpenses: cashSum,
            totalQrisExpenses: qrisSum,
        };
    }, [expenses]);

    // Kalkulasi Saldo Akhir Berdasarkan Rumus:
    // Saldo Akhir Cash = Saldo Awal Cash + Total Penjualan CASH - Total Pengeluaran dari CASH
    // Saldo Akhir QRIS = Saldo Awal QRIS + Total Penjualan QRIS - Total Pengeluaran dari QRIS
    const saldoAwalCash = cashBalance?.initialAmount ?? 0;
    const totalPenjualanCash = summary.totalCash || 0;
    const saldoAkhirCash = saldoAwalCash + totalPenjualanCash - totalCashExpenses;

    const saldoAwalQris = qrisBalance?.initialAmount ?? 0;
    const totalPenjualanQris = summary.totalQris || 0;
    const saldoAkhirQris = saldoAwalQris + totalPenjualanQris - totalQrisExpenses;

    // Fetch saldo riil terkini
    const fetchBalances = async () => {
        try {
            const res = await fetch("/api/balances");
            if (res.ok) {
                const json = await res.json();
                if (json.success && json.data) {
                    if (json.data.cash) {
                        setCashBalance(json.data.cash);
                        localStorage.setItem("pos_balance_cash", JSON.stringify(json.data.cash));
                    }
                    if (json.data.qris) {
                        setQrisBalance(json.data.qris);
                        localStorage.setItem("pos_balance_qris", JSON.stringify(json.data.qris));
                    }
                }
            }
        } catch (err) {
            console.warn("Gagal memuat saldo riil dari API, membaca cache lokal:", err);
        }
    };

    // Load cache saldo saat mount
    useEffect(() => {
        try {
            const cachedCash = localStorage.getItem("pos_balance_cash");
            if (cachedCash) setCashBalance(JSON.parse(cachedCash));
            const cachedQris = localStorage.getItem("pos_balance_qris");
            if (cachedQris) setQrisBalance(JSON.parse(cachedQris));
        } catch (e) {}
        fetchBalances();
        fetchDeletedExpenses();
    }, []);

    // Fetch data pengeluaran dan ringkasan finansial dari API
    const fetchExpenses = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/expenses?startDate=${startDate}&endDate=${endDate}`);
            const json = await res.json();
            if (json.success && json.data) {
                setExpenses(json.data.expenses);
                setSummary(json.data.summary);
                if (json.data.balances) {
                    if (json.data.balances.cash) setCashBalance(json.data.balances.cash);
                    if (json.data.balances.qris) setQrisBalance(json.data.balances.qris);
                }
            }
        } catch (err) {
            console.error(err);
            toast.error("Gagal memuat data pengeluaran");
        } finally {
            setIsLoading(false);
        }
    };

    // FITUR 4: Fetch Riwayat Pengeluaran yang Dihapus (Audit Log)
    const fetchDeletedExpenses = async () => {
        setIsLoadingDeleted(true);
        try {
            const res = await fetch("/api/expenses/deleted");
            const json = await res.json();
            if (json.success && json.data) {
                setDeletedExpenses(json.data);
            }
        } catch (err) {
            console.warn("Gagal memuat audit log riwayat hapus:", err);
        } finally {
            setIsLoadingDeleted(false);
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

    // FITUR 1: Buka Modal Edit Saldo Awal
    const handleOpenEditBalance = (type: "CASH" | "QRIS") => {
        setEditingType(type);
        const current = type === "CASH" ? cashBalance : qrisBalance;
        setInitialBalanceInput(current?.initialAmount !== undefined ? String(current.initialAmount) : "0");
        setBalanceNoteInput(current?.note || "");
        setIsBalanceModalOpen(true);
    };

    // FITUR 1: Simpan Nilai Saldo Awal
    const handleSaveBalance = async (e: React.FormEvent) => {
        e.preventDefault();
        const rawNum = initialBalanceInput.replace(/\D/g, "");
        const numInitial = rawNum ? parseInt(rawNum, 10) : 0;

        if (isNaN(numInitial) || numInitial < 0) {
            toast.error("Nominal saldo awal tidak valid!");
            return;
        }

        // Kalkulasi saldo akhir terkini saat menyimpan
        const computedEnding =
            editingType === "CASH"
                ? numInitial + totalPenjualanCash - totalCashExpenses
                : numInitial + totalPenjualanQris - totalQrisExpenses;

        setIsSavingBalance(true);
        try {
            const res = await fetch("/api/balances", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: editingType,
                    actualAmount: computedEnding,
                    initialAmount: numInitial,
                    note: balanceNoteInput.trim() || undefined,
                }),
            });

            const newBalance: BalanceItem = {
                type: editingType,
                actualAmount: computedEnding,
                initialAmount: numInitial,
                calculatedEndingBalance: computedEnding,
                note: balanceNoteInput.trim() || null,
                updatedAt: new Date().toISOString(),
            };

            if (editingType === "CASH") {
                setCashBalance(newBalance);
                localStorage.setItem("pos_balance_cash", JSON.stringify(newBalance));
            } else {
                setQrisBalance(newBalance);
                localStorage.setItem("pos_balance_qris", JSON.stringify(newBalance));
            }

            if (res.ok) {
                const json = await res.json();
                if (json.data) {
                    if (editingType === "CASH") setCashBalance(json.data);
                    else setQrisBalance(json.data);
                }
            }

            toast.success(
                `Saldo Awal ${editingType === "CASH" ? "Toko (Cash)" : "Bank (QRIS)"} berhasil disimpan!`
            );
            setIsBalanceModalOpen(false);
            fetchExpenses();
        } catch (err: any) {
            toast.error(err.message || "Gagal menyimpan saldo awal");
        } finally {
            setIsSavingBalance(false);
        }
    };

    // FITUR 2: Handle Simpan Catatan Pengeluaran Baru
    const handleSubmitExpense = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim()) {
            toast.error("Nama biaya wajib diisi!");
            return;
        }

        let totalAmount = 0;
        let cAmt = 0;
        let qAmt = 0;

        if (paymentMethod === "CASH") {
            cAmt = parseInt(singleAmount.replace(/\D/g, ""), 10) || 0;
            if (cAmt <= 0) {
                toast.error("Nominal pengeluaran tunai (Cash) wajib diisi!");
                return;
            }
            totalAmount = cAmt;
        } else if (paymentMethod === "QRIS") {
            qAmt = parseInt(singleAmount.replace(/\D/g, ""), 10) || 0;
            if (qAmt <= 0) {
                toast.error("Nominal pengeluaran transfer / QRIS wajib diisi!");
                return;
            }
            totalAmount = qAmt;
        } else if (paymentMethod === "SPLIT") {
            cAmt = parseInt(splitCashAmount.replace(/\D/g, ""), 10) || 0;
            qAmt = parseInt(splitQrisAmount.replace(/\D/g, ""), 10) || 0;
            totalAmount = cAmt + qAmt;

            if (totalAmount <= 0) {
                toast.error("Isi nominal Cash dan/atau QRIS untuk metode Split!");
                return;
            }
        }

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/expenses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: title.trim(),
                    amount: totalAmount,
                    category,
                    paymentMethod,
                    cashAmount: cAmt,
                    qrisAmount: qAmt,
                    expenseDate,
                    notes: notes.trim() || undefined,
                }),
            });

            if (res.ok) {
                toast.success("Catatan pengeluaran berhasil disimpan!");
                setIsModalOpen(false);
                setTitle("");
                setSingleAmount("");
                setSplitCashAmount("");
                setSplitQrisAmount("");
                setNotes("");
                setPaymentMethod("CASH");
                setExpenseDate(getTodayStr());
                fetchExpenses();
            } else {
                const errData = await res.json();
                throw new Error(errData.message || "Gagal mencatat pengeluaran");
            }
        } catch (err: any) {
            toast.error(err.message || "Gagal mencatat pengeluaran");
        } finally {
            setIsSubmitting(false);
        }
    };

    // FITUR 3: Handle Hapus Pengeluaran Satuan
    const handleConfirmDeleteSingle = async () => {
        if (!itemToDelete) return;

        setIsDeletingItem(true);
        try {
            const res = await fetch(`/api/expenses?id=${itemToDelete.id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                toast.success(`Pengeluaran "${itemToDelete.title}" berhasil dihapus & saldo otomatis dikembalikan!`);
                setIsDeleteModalOpen(false);
                setItemToDelete(null);
                fetchExpenses();
                fetchDeletedExpenses();
            } else {
                const errJson = await res.json();
                throw new Error(errJson.message || "Gagal menghapus pengeluaran");
            }
        } catch (err: any) {
            toast.error(err.message || "Gagal menghapus pengeluaran");
        } finally {
            setIsDeletingItem(false);
        }
    };

    // FITUR 3: Handle Hapus Semua Pengeluaran
    const handleConfirmDeleteAll = async () => {
        setIsDeletingAll(true);
        try {
            const res = await fetch(`/api/expenses?all=true&startDate=${startDate}&endDate=${endDate}`, {
                method: "DELETE",
            });

            if (res.ok) {
                toast.success(`Semua catatan pengeluaran berhasil dihapus & diarsipkan ke riwayat audit!`);
                setIsDeleteAllModalOpen(false);
                fetchExpenses();
                fetchDeletedExpenses();
            } else {
                const errJson = await res.json();
                throw new Error(errJson.message || "Gagal menghapus semua pengeluaran");
            }
        } catch (err: any) {
            toast.error(err.message || "Gagal menghapus semua pengeluaran");
        } finally {
            setIsDeletingAll(false);
        }
    };

    // FITUR 4: Handle Restore Pengeluaran yang Dihapus
    const handleRestoreExpense = async (deletedItem: DeletedExpenseItem) => {
        setRestoringId(deletedItem.id);
        try {
            const res = await fetch("/api/expenses/deleted", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: deletedItem.id }),
            });

            if (res.ok) {
                toast.success(`Catatan "${deletedItem.title}" berhasil dipulihkan! Saldo otomatis terhitung kembali.`);
                fetchExpenses();
                fetchDeletedExpenses();
            } else {
                const errData = await res.json();
                throw new Error(errData.message || "Gagal memulihkan catatan");
            }
        } catch (err: any) {
            toast.error(err.message || "Gagal memulihkan catatan");
        } finally {
            setRestoringId(null);
        }
    };

    return (
        <div className="min-h-screen bg-[#F0F7FF] dark:bg-slate-950 pt-2 sm:pt-20 pb-32 text-slate-900 dark:text-slate-50 transition-colors duration-200 overflow-x-hidden">
            <div className="mx-auto max-w-7xl px-2.5 sm:px-4 lg:px-8 space-y-3 sm:space-y-4">
                {/* HEADER & DATE RANGE FILTER */}
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

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <button
                                type="button"
                                onClick={() => {
                                    fetchExpenses();
                                    fetchBalances();
                                    toast.success("Data kas & saldo berhasil disegarkan!");
                                }}
                                className="w-1/2 sm:w-auto rounded-xl border border-blue-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-blue-50 transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                                title="Segarkan Data Transaksi & Saldo"
                            >
                                <span>🔄</span>
                                <span>Segarkan</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(true)}
                                className="w-1/2 sm:w-auto rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-blue-600/30 hover:bg-blue-700 transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                            >
                                <span>+</span> Catat Pengeluaran
                            </button>
                        </div>
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

                        {/* INPUT TANGGAL RESPONSIF */}
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

                {/* FITUR 1: 2 KARTU SALDO AWAL & KALKULASI SALDO AKHIR RIIL TOKO & BANK */}
                {/* 1. Tersisa di Toko (Cash) & 2. Tersisa di Bank (QRIS) */}
                <div className="rounded-2xl bg-white dark:bg-slate-900 p-3 sm:p-4 shadow-sm border border-blue-100 dark:border-slate-800 space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <span className="text-base sm:text-xl">⚖️</span>
                            <div>
                                <h2 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                                    Penyesuaian Saldo Awal &amp; Kalkulasi Saldo Kasir / Bank
                                </h2>
                                <p className="text-[10px] text-slate-400">
                                    Rumus otomatis: Saldo Awal + Total Penjualan - Total Pengeluaran
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                        {/* KARTU 1: Tersisa di Toko (Cash) */}
                        <div className="rounded-2xl bg-gradient-to-br from-emerald-50/70 to-white dark:from-slate-900 dark:to-emerald-950/20 p-3.5 sm:p-4 border-2 border-emerald-300 dark:border-emerald-800/80 shadow-sm relative overflow-hidden group hover:border-emerald-500 transition duration-200 flex flex-col justify-between">
                            <div>
                                <div className="flex items-start justify-between gap-2">
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-base sm:text-lg">💵</span>
                                            <span className="text-[10px] sm:text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                                                Tersisa di Toko (Cash)
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-slate-400">
                                            Sisa uang fisik riil di laci kasir setelah transaksi
                                        </p>
                                    </div>

                                    {/* Tombol Edit Saldo Awal */}
                                    <button
                                        type="button"
                                        onClick={() => handleOpenEditBalance("CASH")}
                                        className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 text-xs font-bold transition active:scale-95 cursor-pointer shadow-sm shadow-emerald-600/20 shrink-0"
                                        title="Edit Saldo Awal Cash"
                                    >
                                        <svg className="h-3.5 w-3.5 fill-none stroke-current" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                        <span>Edit</span>
                                    </button>
                                </div>

                                {/* Nominal Saldo Akhir */}
                                <div className="text-lg sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2 truncate">
                                    {formatIDR(saldoAkhirCash)}
                                </div>

                                {/* Rincian Rumus Kalkulasi */}
                                <div className="mt-2.5 p-2 bg-emerald-500/10 dark:bg-emerald-950/40 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40 space-y-1 text-[11px]">
                                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                                        <span className="flex items-center gap-1 text-[10px]">
                                            <span>🪙</span> Saldo Awal:
                                        </span>
                                        <span className="font-bold">{formatIDR(saldoAwalCash)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-emerald-700 dark:text-emerald-400">
                                        <span className="flex items-center gap-1 text-[10px]">
                                            <span>📈</span> Penjualan Cash (+):
                                        </span>
                                        <span className="font-bold">+{formatIDR(totalPenjualanCash)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-rose-600 dark:text-rose-400">
                                        <span className="flex items-center gap-1 text-[10px]">
                                            <span>📉</span> Pengeluaran Cash (-):
                                        </span>
                                        <span className="font-bold">-{formatIDR(totalCashExpenses)}</span>
                                    </div>
                                    <div className="pt-1 border-t border-emerald-200/80 dark:border-emerald-800/80 flex justify-between items-center font-black text-emerald-700 dark:text-emerald-300 text-xs">
                                        <span>= Sisa Saldo Akhir:</span>
                                        <span>{formatIDR(saldoAkhirCash)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-2 pt-2 border-t border-emerald-100 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 space-y-0.5">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400">Terakhir Update:</span>
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                                        {formatDateTime(cashBalance?.updatedAt)}
                                    </span>
                                </div>
                                {cashBalance?.note && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-400">Catatan:</span>
                                        <span className="italic text-slate-600 dark:text-slate-300 truncate max-w-[200px]">
                                            "{cashBalance.note}"
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* KARTU 2: Tersisa di Bank (QRIS) */}
                        <div className="rounded-2xl bg-gradient-to-br from-blue-50/70 to-white dark:from-slate-900 dark:to-blue-950/20 p-3.5 sm:p-4 border-2 border-blue-300 dark:border-blue-800/80 shadow-sm relative overflow-hidden group hover:border-blue-500 transition duration-200 flex flex-col justify-between">
                            <div>
                                <div className="flex items-start justify-between gap-2">
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-base sm:text-lg">🏦</span>
                                            <span className="text-[10px] sm:text-xs font-black text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                                                Tersisa di Bank (QRIS)
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-slate-400">
                                            Saldo riil yang tersimpan di rekening bank QRIS
                                        </p>
                                    </div>

                                    {/* Tombol Edit Saldo Awal */}
                                    <button
                                        type="button"
                                        onClick={() => handleOpenEditBalance("QRIS")}
                                        className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 text-xs font-bold transition active:scale-95 cursor-pointer shadow-sm shadow-blue-600/20 shrink-0"
                                        title="Edit Saldo Awal QRIS"
                                    >
                                        <svg className="h-3.5 w-3.5 fill-none stroke-current" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                        <span>Edit</span>
                                    </button>
                                </div>

                                {/* Nominal Saldo Akhir */}
                                <div className="text-lg sm:text-2xl font-black text-blue-600 dark:text-blue-400 mt-2 truncate">
                                    {formatIDR(saldoAkhirQris)}
                                </div>

                                {/* Rincian Rumus Kalkulasi */}
                                <div className="mt-2.5 p-2 bg-blue-500/10 dark:bg-blue-950/40 rounded-xl border border-blue-200/60 dark:border-blue-900/40 space-y-1 text-[11px]">
                                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                                        <span className="flex items-center gap-1 text-[10px]">
                                            <span>🪙</span> Saldo Awal:
                                        </span>
                                        <span className="font-bold">{formatIDR(saldoAwalQris)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-blue-700 dark:text-blue-400">
                                        <span className="flex items-center gap-1 text-[10px]">
                                            <span>📈</span> Penjualan QRIS (+):
                                        </span>
                                        <span className="font-bold">+{formatIDR(totalPenjualanQris)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-rose-600 dark:text-rose-400">
                                        <span className="flex items-center gap-1 text-[10px]">
                                            <span>📉</span> Pengeluaran QRIS (-):
                                        </span>
                                        <span className="font-bold">-{formatIDR(totalQrisExpenses)}</span>
                                    </div>
                                    <div className="pt-1 border-t border-blue-200/80 dark:border-blue-800/80 flex justify-between items-center font-black text-blue-700 dark:text-blue-300 text-xs">
                                        <span>= Sisa Saldo Akhir:</span>
                                        <span>{formatIDR(saldoAkhirQris)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-2 pt-2 border-t border-blue-100 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 space-y-0.5">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400">Terakhir Update:</span>
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                                        {formatDateTime(qrisBalance?.updatedAt)}
                                    </span>
                                </div>
                                {qrisBalance?.note && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-400">Catatan:</span>
                                        <span className="italic text-slate-600 dark:text-slate-300 truncate max-w-[200px]">
                                            "{qrisBalance.note}"
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* FINANCIAL SUMMARY CARDS DENGAN OMZET & LABA BERSIH */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                    {/* Card 1: Total Pengeluaran */}
                    <div className="rounded-2xl bg-white dark:bg-slate-900 p-3 sm:p-4 border border-rose-200 dark:border-rose-900/60 shadow-sm">
                        <span className="text-[9px] sm:text-xs font-bold text-rose-500 uppercase tracking-wider block">
                            TOTAL PENGELUARAN
                        </span>
                        <div className="text-base sm:text-2xl font-black text-rose-600 mt-0.5 truncate">
                            {formatIDR(summary.totalExpense)}
                        </div>
                        <p className="text-[9px] text-slate-400 mt-0.5">
                            Cash: {formatIDR(totalCashExpenses)} | QRIS: {formatIDR(totalQrisExpenses)}
                        </p>
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

                    {/* Card 3: Keuntungan Bersih (Net Profit) */}
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
                    <div className="p-2.5 sm:p-3.5 bg-sky-50/50 dark:bg-slate-800/50 border-b border-blue-100 dark:border-slate-800 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                                Daftar Catatan Pengeluaran ({expenses.length})
                            </h3>
                            {isLoading && (
                                <span className="text-[10px] text-blue-600 font-semibold animate-pulse">
                                    Memuat data...
                                </span>
                            )}
                        </div>

                        {/* FITUR 3: Tombol Hapus Semua Pengeluaran */}
                        {expenses.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setIsDeleteAllModalOpen(true)}
                                className="flex items-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition active:scale-95 cursor-pointer"
                                title="Hapus semua pengeluaran pada rentang tanggal aktif"
                            >
                                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                <span>Hapus Semua</span>
                            </button>
                        )}
                    </div>

                    {/* TAMPILAN MOBILE */}
                    <div className="sm:hidden divide-y divide-blue-50 dark:divide-slate-800 p-2 space-y-2">
                        {expenses.map((exp) => {
                            const method = exp.paymentMethod || "CASH";
                            return (
                                <div
                                    key={exp.id}
                                    className="p-2.5 bg-sky-50/30 dark:bg-slate-800/40 rounded-xl space-y-1.5 border border-blue-100/60 dark:border-slate-800 text-xs"
                                >
                                    {/* Tanggal & Kategori & Sumber Dana */}
                                    <div className="flex items-center justify-between gap-1 text-[10px]">
                                        <span className="font-mono text-slate-500 dark:text-slate-400 font-semibold">
                                            📅 {new Date(exp.expenseDate).toLocaleDateString("id-ID", {
                                                day: "2-digit",
                                                month: "short",
                                                year: "numeric",
                                            })}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <span className="rounded-full bg-blue-50 dark:bg-blue-950 px-2 py-0.5 font-bold text-blue-700 dark:text-blue-300">
                                                {exp.category}
                                            </span>
                                            {/* Badge Sumber Dana */}
                                            {method === "CASH" && (
                                                <span className="rounded-full bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                                    💵 Cash
                                                </span>
                                            )}
                                            {method === "QRIS" && (
                                                <span className="rounded-full bg-blue-50 dark:bg-blue-950 px-2 py-0.5 font-bold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                                    🏦 QRIS
                                                </span>
                                            )}
                                            {method === "SPLIT" && (
                                                <span className="rounded-full bg-purple-50 dark:bg-purple-950 px-2 py-0.5 font-bold text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                                    🔀 Split
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* NAMA BIAYA */}
                                    <div className="pt-0.5">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                                            Nama Biaya:
                                        </span>
                                        <p className="font-bold text-slate-900 dark:text-white text-xs leading-snug break-words">
                                            {exp.title}
                                        </p>
                                    </div>

                                    {/* DETAIL SPLIT JIKA ADA */}
                                    {method === "SPLIT" && (
                                        <div className="text-[10px] text-purple-700 dark:text-purple-300 font-semibold bg-purple-50/70 dark:bg-purple-950/40 p-1.5 rounded-lg border border-purple-100 dark:border-purple-900">
                                            Split: Cash {formatIDR(exp.cashAmount ?? 0)} • QRIS {formatIDR(exp.qrisAmount ?? 0)}
                                        </div>
                                    )}

                                    {/* KETERANGAN */}
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

                                    {/* Nominal & Tombol Hapus */}
                                    <div className="flex items-center justify-between pt-1.5 border-t border-blue-100/60 dark:border-slate-800 text-[10px]">
                                        <div>
                                            <span className="text-slate-400 font-semibold block text-[9px]">Nominal:</span>
                                            <span className="font-black text-xs text-rose-600 dark:text-rose-400">
                                                {formatIDR(exp.amount)}
                                            </span>
                                        </div>

                                        {/* FITUR 3: Tombol Hapus Baris */}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setItemToDelete(exp);
                                                setIsDeleteModalOpen(true);
                                            }}
                                            className="flex items-center gap-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800 px-2 py-1 text-[11px] font-bold transition active:scale-95 cursor-pointer"
                                        >
                                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                            <span>Hapus</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* TAMPILAN TABLE DESKTOP / TABLET */}
                    <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                            <thead className="bg-sky-50/30 dark:bg-slate-800/40 text-[10px] uppercase text-slate-400 font-bold border-b border-blue-100 dark:border-slate-800">
                                <tr>
                                    <th className="px-4 py-3">TANGGAL</th>
                                    <th className="px-4 py-3">KATEGORI</th>
                                    <th className="px-4 py-3">NAMA BIAYA</th>
                                    <th className="px-4 py-3">SUMBER DANA</th>
                                    <th className="px-4 py-3">KETERANGAN</th>
                                    <th className="px-4 py-3 text-right">NOMINAL</th>
                                    <th className="px-4 py-3 text-center">AKSI</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-blue-50 dark:divide-slate-800">
                                {expenses.map((exp) => {
                                    const method = exp.paymentMethod || "CASH";
                                    return (
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
                                            <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                                                {exp.title}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                {method === "CASH" && (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                                        💵 Cash
                                                    </span>
                                                )}
                                                {method === "QRIS" && (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-950 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                                        🏦 QRIS
                                                    </span>
                                                )}
                                                {method === "SPLIT" && (
                                                    <div className="inline-flex flex-col">
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 dark:bg-purple-950 px-2 py-0.5 text-[10px] font-bold text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                                            🔀 Split
                                                        </span>
                                                        <span className="text-[9px] text-purple-600 dark:text-purple-400 mt-0.5">
                                                            C: {formatIDR(exp.cashAmount ?? 0)} | Q: {formatIDR(exp.qrisAmount ?? 0)}
                                                        </span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                                                {exp.notes || "-"}
                                            </td>
                                            <td className="px-4 py-3 text-right font-black text-rose-600 dark:text-rose-400 whitespace-nowrap">
                                                {formatIDR(exp.amount)}
                                            </td>
                                            <td className="px-4 py-3 text-center whitespace-nowrap">
                                                {/* FITUR 3: Tombol Hapus Satuan */}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setItemToDelete(exp);
                                                        setIsDeleteModalOpen(true);
                                                    }}
                                                    className="inline-flex items-center gap-1 rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50/60 dark:bg-rose-950/40 px-2.5 py-1 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900 transition active:scale-95 cursor-pointer"
                                                    title="Hapus Pengeluaran"
                                                >
                                                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                    <span>Hapus</span>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {expenses.length === 0 && !isLoading && (
                        <div className="p-8 text-center text-xs text-slate-400">
                            Belum ada catatan pengeluaran pada rentang tanggal yang dipilih.
                        </div>
                    )}
                </div>

                {/* FITUR 4: SEKSI RIWAYAT PENGELUARAN DIHAPUS (AUDIT LOG) */}
                <div className="overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800">
                    <div className="p-3 sm:p-3.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-base sm:text-lg">📜</span>
                            <div>
                                <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                                    <span>Riwayat Pengeluaran Dihapus (Audit Log)</span>
                                    <span className="rounded-full bg-slate-200 dark:bg-slate-700 px-2 py-0.2 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                                        {deletedExpenses.length}
                                    </span>
                                </h3>
                                <p className="text-[10px] text-slate-400">
                                    Catatan pengeluaran yang pernah dihapus dapat dipulihkan kapan saja.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setShowDeletedHistory(!showDeletedHistory)}
                                className="rounded-lg border border-slate-300 dark:border-slate-700 px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                            >
                                {showDeletedHistory ? "Sembunyikan" : "Tampilkan"}
                            </button>
                        </div>
                    </div>

                    {showDeletedHistory && (
                        <div>
                            {/* MOBILE LIST AUDIT LOG */}
                            <div className="sm:hidden divide-y divide-slate-100 dark:divide-slate-800 p-2 space-y-2">
                                {deletedExpenses.map((del) => (
                                    <div
                                        key={del.id}
                                        className="p-2.5 bg-slate-50/60 dark:bg-slate-800/30 rounded-xl space-y-1.5 border border-slate-200/60 dark:border-slate-800 text-xs"
                                    >
                                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                                            <span>
                                                🗑️ Dihapus: {formatDateTime(del.deletedAt)}
                                            </span>
                                            <span className="font-bold text-slate-600 dark:text-slate-300">
                                                {del.category}
                                            </span>
                                        </div>

                                        <div className="pt-0.5">
                                            <p className="font-bold text-slate-900 dark:text-white text-xs">
                                                {del.title}
                                            </p>
                                            <span className="text-[10px] text-slate-400">
                                                Tgl Pengeluaran: {new Date(del.expenseDate).toLocaleDateString("id-ID")}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800">
                                            <div>
                                                <span className="text-[10px] text-slate-400 block">Nominal:</span>
                                                <span className="font-black text-xs text-slate-800 dark:text-slate-200">
                                                    {formatIDR(del.amount)} ({del.paymentMethod})
                                                </span>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => handleRestoreExpense(del)}
                                                disabled={restoringId === del.id}
                                                className="flex items-center gap-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-1 text-[11px] font-bold transition active:scale-95 cursor-pointer"
                                            >
                                                {restoringId === del.id ? (
                                                    <span>Memulihkan...</span>
                                                ) : (
                                                    <>
                                                        <span>🔄</span>
                                                        <span>Pulihkan</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* DESKTOP TABLE AUDIT LOG */}
                            <div className="hidden sm:block overflow-x-auto">
                                <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                                    <thead className="bg-slate-50 dark:bg-slate-800/40 text-[10px] uppercase text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                                        <tr>
                                            <th className="px-4 py-2.5">WAKTU DIHAPUS</th>
                                            <th className="px-4 py-2.5">TGL PENGELUARAN</th>
                                            <th className="px-4 py-2.5">KATEGORI</th>
                                            <th className="px-4 py-2.5">NAMA BIAYA</th>
                                            <th className="px-4 py-2.5">SUMBER PEMBAYARAN</th>
                                            <th className="px-4 py-2.5 text-right">NOMINAL</th>
                                            <th className="px-4 py-2.5 text-center">AKSI</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {deletedExpenses.map((del) => (
                                            <tr key={del.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition">
                                                <td className="px-4 py-2.5 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                                                    {formatDateTime(del.deletedAt)}
                                                </td>
                                                <td className="px-4 py-2.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                                                    {new Date(del.expenseDate).toLocaleDateString("id-ID")}
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                                                        {del.category}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5 font-semibold text-slate-900 dark:text-white">
                                                    {del.title}
                                                </td>
                                                <td className="px-4 py-2.5 whitespace-nowrap">
                                                    <span className="font-bold text-[11px] text-slate-700 dark:text-slate-300">
                                                        {del.paymentMethod}
                                                    </span>
                                                    {del.paymentMethod === "SPLIT" && (
                                                        <span className="text-[10px] text-slate-400 ml-1">
                                                            (C: {formatIDR(del.cashAmount)} | Q: {formatIDR(del.qrisAmount)})
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2.5 text-right font-black text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                                    {formatIDR(del.amount)}
                                                </td>
                                                <td className="px-4 py-2.5 text-center whitespace-nowrap">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRestoreExpense(del)}
                                                        disabled={restoringId === del.id}
                                                        className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition active:scale-95 cursor-pointer"
                                                        title="Pulihkan Catatan Pengeluaran"
                                                    >
                                                        {restoringId === del.id ? (
                                                            <span>Memulihkan...</span>
                                                        ) : (
                                                            <>
                                                                <span>🔄</span>
                                                                <span>Pulihkan</span>
                                                            </>
                                                        )}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {deletedExpenses.length === 0 && !isLoadingDeleted && (
                                <div className="p-6 text-center text-xs text-slate-400">
                                    Belum ada riwayat pengeluaran yang dihapus.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* FITUR 1: MODAL EDIT SALDO AWAL (CASH / QRIS) */}
            {isBalanceModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 backdrop-blur-sm animate-fadeIn">
                    <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-blue-100 dark:border-slate-800 text-slate-800 dark:text-white transition-all">
                        {/* Header Modal */}
                        <div
                            className={`p-4 text-white flex items-center justify-between ${
                                editingType === "CASH"
                                    ? "bg-gradient-to-r from-emerald-600 to-teal-600"
                                    : "bg-gradient-to-r from-blue-600 to-indigo-600"
                            }`}
                        >
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-lg shadow-sm">
                                    {editingType === "CASH" ? "💵" : "🏦"}
                                </div>
                                <div>
                                    <h3 className="font-black text-sm sm:text-base leading-tight">
                                        Edit Saldo Awal {editingType === "CASH" ? "Toko (Cash)" : "Bank (QRIS)"}
                                    </h3>
                                    <p className="text-[11px] text-white/80">
                                        Atur modal kasir awal / saldo pembuka rekening
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsBalanceModalOpen(false)}
                                className="rounded-full bg-white/20 p-1.5 text-white hover:bg-white/30 transition cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Form Body */}
                        <form onSubmit={handleSaveBalance} className="p-4 sm:p-5 space-y-4">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                    Nilai Saldo Awal (Rp) <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-2.5 text-sm font-bold text-slate-400">
                                        Rp
                                    </span>
                                    <input
                                        type="number"
                                        min="0"
                                        autoFocus
                                        placeholder="0"
                                        value={initialBalanceInput}
                                        onChange={(e) => setInitialBalanceInput(e.target.value)}
                                        className="w-full rounded-xl border-2 border-blue-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 pl-11 text-base font-black text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1">
                                    {editingType === "CASH"
                                        ? "Modal awal uang fisik di laci kasir sebelum penjualan dimulai."
                                        : "Saldo awal rekening bank pembuka sebelum penerimaan QRIS."}
                                </p>
                            </div>

                            {/* Tombol Shortcut Nominal Cepat */}
                            <div>
                                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                                    SHORTCUT NOMINAL CEPAT:
                                </span>
                                <div className="grid grid-cols-3 gap-1.5">
                                    {[50000, 100000, 200000, 500000, 1000000].map((amt) => (
                                        <button
                                            key={amt}
                                            type="button"
                                            onClick={() => {
                                                const current = parseInt(initialBalanceInput || "0", 10) || 0;
                                                setInitialBalanceInput(String(current + amt));
                                            }}
                                            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-2 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-700 transition cursor-pointer"
                                        >
                                            +{amt >= 1000000 ? `${amt / 1000000}jt` : `${amt / 1000}rb`}
                                        </button>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => setInitialBalanceInput("0")}
                                        className="rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/30 px-2 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-100 transition cursor-pointer"
                                    >
                                        Nolkan (0)
                                    </button>
                                </div>
                            </div>

                            {/* LIVE PREVIEW KALKULASI SALDO AKHIR */}
                            {(() => {
                                const previewInit = parseInt(initialBalanceInput || "0", 10) || 0;
                                const previewSales = editingType === "CASH" ? totalPenjualanCash : totalPenjualanQris;
                                const previewExp = editingType === "CASH" ? totalCashExpenses : totalQrisExpenses;
                                const previewEnding = previewInit + previewSales - previewExp;

                                return (
                                    <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
                                        <div className="text-[10px] font-bold uppercase text-slate-400">
                                            Kalkulasi Otomatis Saldo Akhir:
                                        </div>
                                        <div className="flex justify-between text-slate-600 dark:text-slate-300">
                                            <span>Saldo Awal Baru:</span>
                                            <span className="font-bold">{formatIDR(previewInit)}</span>
                                        </div>
                                        <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                                            <span>(+) Penjualan {editingType}:</span>
                                            <span className="font-bold">+{formatIDR(previewSales)}</span>
                                        </div>
                                        <div className="flex justify-between text-rose-600 dark:text-rose-400">
                                            <span>(-) Pengeluaran {editingType}:</span>
                                            <span className="font-bold">-{formatIDR(previewExp)}</span>
                                        </div>
                                        <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700 flex justify-between font-black text-sm text-blue-600 dark:text-blue-400">
                                            <span>= Saldo Akhir Terkalkulasi:</span>
                                            <span>{formatIDR(previewEnding)}</span>
                                        </div>
                                    </div>
                                );
                            })()}

                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                    Catatan / Keterangan (Opsional)
                                </label>
                                <textarea
                                    rows={2}
                                    placeholder="Contoh: Modal kasir pagi shift 1, saldo buka rekening..."
                                    value={balanceNoteInput}
                                    onChange={(e) => setBalanceNoteInput(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
                                />
                            </div>

                            {/* Tombol Aksi */}
                            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setIsBalanceModalOpen(false)}
                                    className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSavingBalance}
                                    className={`rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-md transition active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                                        editingType === "CASH"
                                            ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30"
                                            : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/30"
                                    }`}
                                >
                                    {isSavingBalance ? (
                                        <>
                                            <span className="animate-spin text-xs">⏳</span>
                                            <span>Menyimpan...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>💾</span>
                                            <span>Simpan Saldo Awal</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* FITUR 2: MODAL INPUT PENGELUARAN DENGAN OPSI SUMBER PEMBAYARAN */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-2 sm:p-4 backdrop-blur-sm animate-fadeIn">
                    <div className="w-full max-w-md max-h-[92vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-2xl border border-blue-100 dark:border-slate-800 text-slate-800 dark:text-white">
                        <div className="flex items-center justify-between border-b border-blue-50 dark:border-slate-800 pb-2.5 mb-3.5">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">📝</span>
                                <div>
                                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                                        Catat Pengeluaran Toko
                                    </h3>
                                    <p className="text-[10px] text-slate-400">
                                        Otomatis mengurangi saldo Cash atau QRIS terkait
                                    </p>
                                </div>
                            </div>
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

                            {/* FITUR 2: OPSI SUMBER PEMBAYARAN */}
                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                                    Sumber Pembayaran (Sumber Dana) *
                                </label>
                                <div className="grid grid-cols-3 gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod("CASH")}
                                        className={`rounded-xl py-2 px-2 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer border ${
                                            paymentMethod === "CASH"
                                                ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20"
                                                : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-emerald-50"
                                        }`}
                                    >
                                        <span>💵</span>
                                        <span>Cash</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod("QRIS")}
                                        className={`rounded-xl py-2 px-2 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer border ${
                                            paymentMethod === "QRIS"
                                                ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20"
                                                : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-blue-50"
                                        }`}
                                    >
                                        <span>🏦</span>
                                        <span>QRIS</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod("SPLIT")}
                                        className={`rounded-xl py-2 px-2 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer border ${
                                            paymentMethod === "SPLIT"
                                                ? "bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/20"
                                                : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-purple-50"
                                        }`}
                                    >
                                        <span>🔀</span>
                                        <span>Split</span>
                                    </button>
                                </div>
                            </div>

                            {/* FIELD NOMINAL: SINGLE (CASH/QRIS) ATAU SPLIT */}
                            {paymentMethod !== "SPLIT" ? (
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                                        Nominal {paymentMethod === "CASH" ? "Pengeluaran Tunai (Cash)" : "Pengeluaran QRIS / Bank"} (Rp) *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        placeholder="Contoh: 125000"
                                        value={singleAmount}
                                        onChange={(e) => setSingleAmount(e.target.value)}
                                        className="w-full rounded-xl border border-blue-200 dark:border-slate-700 bg-sky-50/30 dark:bg-slate-800 px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                                    />
                                    {singleAmount && !isNaN(Number(singleAmount)) && (
                                        <p className="text-[11px] text-blue-600 dark:text-blue-400 font-bold mt-1">
                                            Terbaca: {formatIDR(Number(singleAmount))} (Mengurangi saldo {paymentMethod})
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-2 p-3 bg-purple-50/50 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-900">
                                    <div className="text-[11px] font-bold text-purple-800 dark:text-purple-300">
                                        Rincian Pembayaran Split:
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase mb-0.5">
                                                Dibayar via Cash (Rp)
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                placeholder="0"
                                                value={splitCashAmount}
                                                onChange={(e) => setSplitCashAmount(e.target.value)}
                                                className="w-full rounded-lg border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase mb-0.5">
                                                Dibayar via QRIS (Rp)
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                placeholder="0"
                                                value={splitQrisAmount}
                                                onChange={(e) => setSplitQrisAmount(e.target.value)}
                                                className="w-full rounded-lg border border-blue-300 dark:border-blue-800 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="pt-1.5 border-t border-purple-200 dark:border-purple-800 flex justify-between items-center text-xs font-black text-purple-900 dark:text-purple-200">
                                        <span>Total Pengeluaran:</span>
                                        <span>
                                            {formatIDR(
                                                (parseInt(splitCashAmount || "0", 10) || 0) +
                                                (parseInt(splitQrisAmount || "0", 10) || 0)
                                            )}
                                        </span>
                                    </div>
                                </div>
                            )}

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

            {/* FITUR 3: POP-UP KONFIRMASI HAPUS PENGELUARAN SATUAN */}
            {isDeleteModalOpen && itemToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 backdrop-blur-sm animate-fadeIn">
                    <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-2xl border border-rose-100 dark:border-slate-800 text-slate-800 dark:text-white space-y-3.5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 text-lg">
                                🗑️
                            </div>
                            <div>
                                <h3 className="font-bold text-sm sm:text-base leading-tight">
                                    Hapus Catatan Pengeluaran?
                                </h3>
                                <p className="text-[11px] text-slate-400">
                                    Data akan diarsipkan ke Riwayat Pengeluaran Dihapus
                                </p>
                            </div>
                        </div>

                        <div className="rounded-xl bg-rose-50/50 dark:bg-rose-950/30 p-3 border border-rose-100 dark:border-rose-900/60 space-y-1 text-xs">
                            <p className="font-bold text-slate-900 dark:text-white">
                                {itemToDelete.title}
                            </p>
                            <p className="text-rose-600 font-extrabold text-sm">
                                {formatIDR(itemToDelete.amount)}
                            </p>
                            <p className="text-[10px] text-slate-500">
                                Sumber: {itemToDelete.paymentMethod || "CASH"} | Kategori: {itemToDelete.category}
                            </p>
                        </div>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Saldo kas/bank yang sebelumnya terpotong oleh pengeluaran ini akan secara otomatis dikembalikan (revert).
                        </p>

                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsDeleteModalOpen(false);
                                    setItemToDelete(null);
                                }}
                                className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                disabled={isDeletingItem}
                                onClick={handleConfirmDeleteSingle}
                                className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 text-xs font-bold transition active:scale-95 cursor-pointer shadow-md shadow-rose-600/30"
                            >
                                {isDeletingItem ? "Menghapus..." : "Ya, Hapus"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* FITUR 3: POP-UP KONFIRMASI HAPUS SEMUA PENGELUARAN */}
            {isDeleteAllModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 backdrop-blur-sm animate-fadeIn">
                    <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-2xl border border-rose-200 dark:border-slate-800 text-slate-800 dark:text-white space-y-3.5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 text-lg">
                                ⚠️
                            </div>
                            <div>
                                <h3 className="font-bold text-sm sm:text-base leading-tight text-rose-600">
                                    Hapus Semua Pengeluaran?
                                </h3>
                                <p className="text-[11px] text-slate-400">
                                    Rentang: {startDate} s/d {endDate}
                                </p>
                            </div>
                        </div>

                        <div className="rounded-xl bg-rose-50 dark:bg-rose-950/40 p-3 border border-rose-200 dark:border-rose-900 space-y-1 text-xs">
                            <p className="font-semibold text-rose-800 dark:text-rose-300 leading-snug">
                                Anda akan menghapus total <span className="font-black">{expenses.length} catatan pengeluaran</span> sejumlah <span className="font-black">{formatIDR(summary.totalExpense)}</span>.
                            </p>
                        </div>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Semua catatan yang dihapus akan disimpan ke tabel <strong>Riwayat Pengeluaran Dihapus (Audit Log)</strong> dan saldo kas/bank akan dikembalikan otomatis.
                        </p>

                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => setIsDeleteAllModalOpen(false)}
                                className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                disabled={isDeletingAll}
                                onClick={handleConfirmDeleteAll}
                                className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 text-xs font-bold transition active:scale-95 cursor-pointer shadow-md shadow-rose-600/30"
                            >
                                {isDeletingAll ? "Menghapus Semua..." : `Ya, Hapus Semua (${expenses.length})`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExpenseManagement;