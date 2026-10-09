"use client";

import React, { useState, useMemo } from "react";
import { usePOS } from "@/context/POSContext";
import { CategoryType, MenuItem, PaymentMethod, Transaction } from "@/types/pos";
import { PaymentModal } from "./PaymentModal";
import { ReceiptModal } from "./ReceiptModal";
import { SaveOrderModal } from "./SaveOrderModal";
import { SavedOrdersModal } from "./SavedOrdersModal";

export const PosTerminal: React.FC = () => {
  const {
    menuList,
    cart,
    currentQueueNumber,
    isMobileCartOpen,
    setIsMobileCartOpen,
    savedOrders,
    activeSavedOrderId,
    activeSavedOrderName,
    setActiveSavedOrderId,
    setActiveSavedOrderName,
    isSaveOrderOpen,
    setIsSaveOrderOpen,
    isSavedOrdersOpen,
    setIsSavedOrdersOpen,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    completePayment,
  } = usePOS();

  const [activeCategory, setActiveCategory] = useState<CategoryType | "Semua">("Semua");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isPaymentOpen, setIsPaymentOpen] = useState<boolean>(false);
  const [completedTx, setCompletedTx] = useState<Transaction | null>(null);

  const categories: (CategoryType | "Semua")[] = [
    "Semua",
    "Minuman",
    "Makanan Ringan",
    "Makanan Berat",
  ];

  const filteredMenu = useMemo(() => {
    return menuList.filter((item) => {
      const matchCategory =
        activeCategory === "Semua" ? true : item.category === activeCategory;
      const matchSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [menuList, activeCategory, searchQuery]);

  const subtotal = cart.reduce(
    (sum, item) => sum + item.menuItem.price * item.quantity,
    0
  );
  const total = subtotal;
  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);
  };

  const handlePaymentSuccess = (method: PaymentMethod, cashReceived?: number) => {
    const tx = completePayment(method, cashReceived);
    setIsPaymentOpen(false);
    setCompletedTx(tx);
  };

  const getCategoryIcon = (cat: CategoryType) => {
    switch (cat) {
      case "Minuman":
        return "☕";
      case "Makanan Ringan":
        return "🍟";
      case "Makanan Berat":
        return "🍛";
      default:
        return "🍴";
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F7FF] dark:bg-slate-950 pt-16 sm:pt-20 pb-36 sm:pb-40 md:pb-24 lg:pb-12 text-slate-900 dark:text-slate-50 transition-colors duration-200">
      <div className="mx-auto max-w-7xl px-2 sm:px-4 lg:px-8">
        {/* HEADER TOP BAR - RAPI DI MOBILE (320PX) & TABLET */}
        <div className="mb-2.5 sm:mb-4 rounded-2xl bg-white dark:bg-slate-900 p-2.5 sm:p-3.5 shadow-sm border border-blue-100 dark:border-slate-800">
          <div className="flex items-center justify-between gap-1.5 sm:gap-3">
            {/* Title & Icon Kasir */}
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20 text-sm sm:text-lg">
                🏪
              </div>
              <div className="min-w-0">
                <h1 className="text-xs sm:text-base md:text-lg font-black text-slate-900 dark:text-white leading-tight truncate">
                  Menu Kasir (POS)
                </h1>
                <p className="text-[10px] text-slate-400 truncate hidden sm:block">
                  Pilih menu &amp; konfirmasi pembayaran
                </p>
              </div>
            </div>

            {/* Aksi Pesanan Tersimpan & Nomor Antrean */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* FITUR 1: Tombol Akses Pesanan Tersimpan */}
              <button
                type="button"
                onClick={() => setIsSavedOrdersOpen(true)}
                className={`flex items-center gap-1 rounded-xl border px-2 py-1 sm:px-2.5 sm:py-1.5 text-[11px] sm:text-xs font-bold transition cursor-pointer active:scale-95 shadow-sm shrink-0 ${
                  savedOrders.length > 0
                    ? "border-amber-400 bg-amber-500 text-white shadow-amber-500/25"
                    : "border-slate-200 dark:border-slate-700 bg-amber-50/70 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300"
                }`}
                title="Lihat daftar pesanan tersimpan"
              >
                <span>📋</span>
                <span className="hidden xs:inline">Tersimpan</span>
                {savedOrders.length > 0 && (
                  <span className={`flex h-4 min-w-4 px-1 items-center justify-center rounded-full text-[9px] font-black ${
                    savedOrders.length > 0
                      ? "bg-white text-amber-600"
                      : "bg-amber-600 text-white"
                  }`}>
                    {savedOrders.length}
                  </span>
                )}
              </button>

              {/* Antrean Info */}
              <div className="flex items-center gap-1 sm:gap-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 px-2 py-1 sm:px-2.5 sm:py-1 shrink-0">
                <div className="text-right">
                  <span className="text-[7px] sm:text-[8px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block leading-none">
                    Antrean
                  </span>
                  <span className="text-xs sm:text-sm md:text-base font-black text-blue-700 dark:text-blue-300 leading-tight">
                    {currentQueueNumber}
                  </span>
                </div>
                <span className="inline-flex h-1.5 w-1.5 sm:h-2 sm:w-2 relative shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-blue-600"></span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* LAYOUT GRID: OPTIMAL DI MOBILE, TABLET (MD: 2 KOLOM), & DESKTOP (LG: 2 KOLOM) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 sm:gap-3 lg:gap-5 items-start">
          {/* KOLOM KIRI: KATALOG MENU */}
          <div className="md:col-span-7 lg:col-span-7 xl:col-span-8 space-y-2 sm:space-y-3">
            {/* Filter Kategori */}
            <div className="rounded-2xl bg-white dark:bg-slate-900 p-2 sm:p-3 shadow-sm border border-blue-100 dark:border-slate-800 space-y-2">
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar -mx-0.5 px-0.5">
                {categories.map((cat) => {
                  const isActive = activeCategory === cat;
                  const count =
                    cat === "Semua"
                      ? menuList.length
                      : menuList.filter((m) => m.category === cat).length;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setActiveCategory(cat)}
                      className={`flex items-center gap-1 rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 text-[11px] sm:text-xs font-bold whitespace-nowrap transition cursor-pointer active:scale-95 shrink-0 ${isActive
                          ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                          : "bg-sky-50/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-100/70 dark:hover:bg-slate-700 border border-blue-100 dark:border-transparent"
                        }`}
                    >
                      <span className="text-xs">
                        {cat === "Semua" ? "✨" : getCategoryIcon(cat as CategoryType)}
                      </span>
                      <span>{cat}</span>
                      <span
                        className={`ml-0.5 rounded-md px-1 py-0.2 text-[9px] font-black ${isActive
                            ? "bg-blue-500/40 text-white"
                            : "bg-blue-100 dark:bg-slate-700 text-blue-700 dark:text-blue-300"
                          }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama kopi, makanan, snack..."
                  className="w-full rounded-xl border border-blue-100 dark:border-slate-800 bg-sky-50/40 dark:bg-slate-800/80 px-3 py-1.5 sm:py-2 pl-8 sm:pl-9 text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <span className="absolute left-2.5 sm:left-3 top-1.5 sm:top-2 text-xs text-slate-400">
                  🔍
                </span>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Grid Daftar Menu */}
            {filteredMenu.length === 0 ? (
              <div className="rounded-2xl bg-white dark:bg-slate-900 p-8 text-center border border-blue-100 dark:border-slate-800 space-y-2">
                <span className="text-3xl">☕</span>
                <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200">
                  Tidak ada menu yang sesuai
                </p>
                <p className="text-[10px] sm:text-xs text-slate-400">
                  Coba ubah kata kunci pencarian atau ganti kategori.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-2.5">
                {filteredMenu.map((item) => {
                  const isSoldOut = item.status === "Habis";
                  const cartItem = cart.find((c) => c.menuItem.id === item.id);
                  const inCartQty = cartItem?.quantity || 0;

                  return (
                    <div
                      key={item.id}
                      onClick={() => !isSoldOut && addToCart(item)}
                      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-white dark:bg-slate-900 p-2 sm:p-2.5 shadow-sm border transition duration-200 ${isSoldOut
                          ? "opacity-60 cursor-not-allowed border-slate-200 dark:border-slate-800"
                          : "hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 cursor-pointer border-blue-100/80 dark:border-slate-800 active:scale-98"
                        }`}
                    >
                      <div className="space-y-1">
                        {/* Header Kartu: Kategori & Badge Kuantitas Rapi */}
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1">
                            <span className="text-sm sm:text-base">
                              {getCategoryIcon(item.category)}
                            </span>
                            {inCartQty > 0 && (
                              <span className="flex h-4 min-w-4 sm:h-5 sm:min-w-5 px-1 items-center justify-center rounded-full bg-blue-600 text-white font-black text-[9px] sm:text-[10px] shadow-sm animate-scaleIn">
                                {inCartQty}x
                              </span>
                            )}
                          </div>
                          <span
                            className={`rounded-md px-1.5 py-0.5 text-[8px] sm:text-[9px] font-bold ${isSoldOut
                                ? "bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400"
                                : "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400"
                              }`}
                          >
                            {item.status}
                          </span>
                        </div>

                        <div>
                          <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                            {item.name}
                          </h3>
                          <p className="text-[9px] sm:text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                            {item.description || "Tanpa deskripsi"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-2 pt-1.5 border-t border-blue-50 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-[11px] sm:text-xs md:text-sm font-extrabold text-blue-600 dark:text-blue-400">
                          {formatIDR(item.price)}
                        </span>
                        <button
                          type="button"
                          disabled={isSoldOut}
                          className={`flex h-6 w-6 sm:h-6.5 sm:w-6.5 items-center justify-center rounded-lg font-bold text-xs transition ${isSoldOut
                              ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                              : "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white shadow-sm"
                            }`}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* KOLOM KANAN: PANEL KERANJANG AKTIF DI TABLET (MD) & DESKTOP (LG) */}
          <div className="hidden md:block md:col-span-5 lg:col-span-5 xl:col-span-4 sticky top-20">
            <div className="rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-blue-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[calc(100vh-6rem)]">
              <div className="p-3 sm:p-3.5 bg-gradient-to-r from-blue-600 to-sky-600 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🛒</span>
                  <div>
                    <h2 className="font-bold text-sm sm:text-base leading-tight">
                      Keranjang Pesanan
                    </h2>
                    <span className="text-[10px] text-blue-100">
                      Antrean: <strong className="text-white">{currentQueueNumber}</strong>
                    </span>
                  </div>
                </div>
                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={clearCart}
                    className="text-xs font-semibold text-blue-100 hover:text-white underline underline-offset-2 transition cursor-pointer"
                  >
                    Batal
                  </button>
                )}
              </div>

              {/* Banner Indikator Pesanan Aktif (Sedang diedit / ditambah menu) */}
              {activeSavedOrderName && (
                <div className="bg-amber-100 dark:bg-amber-950/80 px-3 py-1.5 border-b border-amber-200 dark:border-amber-900/60 flex items-center justify-between text-xs animate-fadeIn">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-amber-800 dark:text-amber-400 font-bold">🏷️ Pesanan:</span>
                    <span className="font-extrabold text-slate-900 dark:text-white truncate">
                      {activeSavedOrderName}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSavedOrderId(null);
                      setActiveSavedOrderName(null);
                    }}
                    className="text-[10px] text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 underline cursor-pointer shrink-0 ml-1"
                    title="Lepas asosiasi pesanan ini agar menjadi pesanan baru"
                  >
                    Lepas
                  </button>
                </div>
              )}

              {/* Items Keranjang */}
              <div className="flex-1 overflow-y-auto p-3 divide-y divide-blue-50 dark:divide-slate-800">
                {cart.length === 0 ? (
                  <div className="py-10 text-center space-y-2">
                    <span className="text-3xl opacity-50">🛒</span>
                    <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400">
                      Keranjang Masih Kosong
                    </p>
                    <p className="text-[10px] sm:text-xs text-slate-400 max-w-[180px] mx-auto">
                      Pilih menu di samping untuk menambahkan pesanan kasir.
                    </p>
                    {savedOrders.length > 0 && (
                      <div className="pt-1.5">
                        <button
                          type="button"
                          onClick={() => setIsSavedOrdersOpen(true)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 text-xs font-bold shadow-md shadow-amber-500/20 transition active:scale-95 cursor-pointer"
                        >
                          <span>📋</span>
                          <span>Buka {savedOrders.length} Pesanan Tersimpan</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.menuItem.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                          {item.menuItem.name}
                        </h4>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {formatIDR(item.menuItem.price)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.menuItem.id, -1)}
                          className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-sky-50 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-200 border border-blue-100 dark:border-transparent hover:bg-sky-100 transition cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-5 text-center font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.menuItem.id, 1)}
                          className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/60 font-bold text-blue-700 dark:text-blue-300 hover:bg-blue-200 transition cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right min-w-[65px]">
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          {formatIDR(item.menuItem.price * item.quantity)}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.menuItem.id)}
                          className="text-[9px] text-rose-500 hover:underline mt-0.5 cursor-pointer"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Subtotal & Tombol Aksi Keranjang Tablet / Desktop */}
              {cart.length > 0 && (
                <div className="p-3 sm:p-4 bg-sky-50/60 dark:bg-slate-800/80 border-t border-blue-100 dark:border-slate-800 space-y-2.5">
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Total Item:</span>
                      <span className="font-semibold">{totalItemCount} pcs</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Subtotal:</span>
                      <span className="font-semibold">{formatIDR(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm sm:text-base font-extrabold text-slate-900 dark:text-white border-t border-blue-200/80 dark:border-slate-700 pt-1">
                      <span>TOTAL BAYAR:</span>
                      <span className="text-blue-600 dark:text-blue-400">
                        {formatIDR(total)}
                      </span>
                    </div>
                  </div>

                  {/* Tombol Simpan/Perbarui Pesanan & Lanjut Bayar */}
                  <div className="space-y-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsPaymentOpen(true)}
                      className="w-full rounded-xl bg-blue-600 py-3 text-sm sm:text-base font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                    >
                      <span>💳</span> Lanjut Bayar ({formatIDR(total)})
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsSaveOrderOpen(true)}
                      className={`w-full rounded-xl border-2 py-2 text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 ${
                        activeSavedOrderName
                          ? "border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/40 dark:border-blue-600 dark:text-blue-300"
                          : "border-amber-400 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:border-amber-600/80 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-300"
                      }`}
                    >
                      <span>💾</span>
                      <span>
                        {activeSavedOrderName
                          ? `Perbarui Pesanan "${activeSavedOrderName}"`
                          : "Simpan Pesanan (Tahan)"}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE FLOATING ACTION BAR (< MD) */}
      <div className="md:hidden fixed bottom-2.5 left-2.5 right-2.5 z-40 animate-fadeIn">
        {cart.length > 0 ? (
          <div className="rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-2 shadow-2xl border border-blue-200/90 dark:border-slate-800 space-y-1.5">
            {/* Baris Atas: Info Keranjang Ringkas */}
            <div
              onClick={() => setIsMobileCartOpen(true)}
              className="flex items-center justify-between px-2.5 py-1.5 bg-blue-50/80 dark:bg-blue-950/60 rounded-xl cursor-pointer hover:bg-blue-100/70 transition border border-blue-100 dark:border-blue-900/40"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="flex h-5 min-w-5 px-1 items-center justify-center rounded-full bg-blue-600 text-white text-[10px] font-black shrink-0">
                  {totalItemCount}
                </span>
                <span className="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-white truncate">
                  {activeSavedOrderName ? `Pesanan: ${activeSavedOrderName}` : "Keranjang Pesanan"}
                </span>
                <span className="text-[9px] text-blue-600 dark:text-blue-400 font-semibold hidden xs:inline">
                  (Rincian ▾)
                </span>
              </div>
              <span className="text-xs font-black text-blue-600 dark:text-blue-400 shrink-0">
                {formatIDR(total)}
              </span>
            </div>

            {/* Baris Bawah: Dua Tombol Aksi Nyaman (Simpan/Perbarui & Bayar) */}
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setIsSaveOrderOpen(true)}
                className={`w-full rounded-xl border py-2 px-2 text-xs font-bold transition flex items-center justify-center gap-1 active:scale-95 shadow-sm cursor-pointer ${
                  activeSavedOrderName
                    ? "border-blue-400 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:border-blue-700 dark:text-blue-300"
                    : "border-amber-300 dark:border-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300"
                }`}
              >
                <span>💾</span>
                <span className="truncate">
                  {activeSavedOrderName ? `Perbarui (${activeSavedOrderName})` : "Simpan"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsPaymentOpen(true)}
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 py-2 px-2 text-white shadow-md shadow-blue-600/30 flex items-center justify-center gap-1 font-bold text-xs active:scale-95 cursor-pointer"
              >
                <span>💳</span>
                <span>Bayar Sekarang</span>
              </button>
            </div>
          </div>
        ) : savedOrders.length > 0 ? (
          <button
            type="button"
            onClick={() => setIsSavedOrdersOpen(true)}
            className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 py-2.5 px-3.5 text-white shadow-xl shadow-amber-500/30 flex items-center justify-between font-bold text-xs active:scale-95 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">📋</span>
              <span>Pesanan Tersimpan</span>
            </div>
            <span className="bg-white/20 rounded-full px-2 py-0.5 text-[10px] font-black">
              {savedOrders.length} Pesanan (Buka) →
            </span>
          </button>
        ) : null}
      </div>

      {/* MOBILE CART DRAWER (< MD) */}
      {isMobileCartOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-h-[85vh] rounded-t-3xl bg-white dark:bg-slate-900 shadow-2xl border-t border-blue-100 dark:border-slate-800 flex flex-col overflow-hidden">
            <div className="pt-2 pb-1 bg-gradient-to-r from-blue-600 to-sky-600">
              <div className="w-10 h-1 bg-white/40 rounded-full mx-auto"></div>
            </div>

            <div className="p-3 sm:p-3.5 bg-gradient-to-r from-blue-600 to-sky-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🛒</span>
                <div>
                  <h3 className="font-bold text-sm sm:text-base">Keranjang Pesanan</h3>
                  <p className="text-[10px] text-blue-100">Antrean {currentQueueNumber}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileCartOpen(false)}
                className="rounded-full bg-white/20 p-1 text-white hover:bg-white/30 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Banner Pesanan Aktif di Drawer */}
            {activeSavedOrderName && (
              <div className="bg-amber-100 dark:bg-amber-950/80 px-3.5 py-1.5 border-b border-amber-200 dark:border-amber-900/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-amber-800 dark:text-amber-400 font-bold">🏷️ Pesanan:</span>
                  <span className="font-extrabold text-slate-900 dark:text-white truncate">
                    {activeSavedOrderName}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveSavedOrderId(null);
                    setActiveSavedOrderName(null);
                  }}
                  className="text-[10px] text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 underline cursor-pointer shrink-0 ml-1"
                >
                  Lepas
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-3 divide-y divide-blue-50 dark:divide-slate-800 space-y-1.5">
              {cart.map((item) => (
                <div key={item.menuItem.id} className="py-2 flex items-center justify-between gap-1.5">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                      {item.menuItem.name}
                    </h4>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {formatIDR(item.menuItem.price)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.menuItem.id, -1)}
                      className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-sky-50 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-200 border border-blue-100 dark:border-transparent"
                    >
                      -
                    </button>
                    <span className="w-5 text-center font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.menuItem.id, 1)}
                      className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/60 font-bold text-blue-700 dark:text-blue-300"
                    >
                      +
                    </button>
                  </div>

                  <div className="text-right min-w-[55px]">
                    <div className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-white">
                      {formatIDR(item.menuItem.price * item.quantity)}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.menuItem.id)}
                      className="text-[9px] text-rose-500 underline cursor-pointer"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 sm:p-4 bg-sky-50/60 dark:bg-slate-800/80 border-t border-blue-100 dark:border-slate-800 space-y-2 pb-6">
              <div className="flex justify-between items-baseline text-slate-900 dark:text-white">
                <span className="text-[11px] text-slate-500 font-semibold">Total Tagihan:</span>
                <span className="text-base sm:text-xl font-black text-blue-600 dark:text-blue-400">
                  {formatIDR(total)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsSaveOrderOpen(true)}
                  className={`w-full rounded-xl border-2 py-2.5 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 ${
                    activeSavedOrderName
                      ? "border-blue-400 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:border-blue-700 dark:text-blue-300"
                      : "border-amber-400 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:border-amber-700 text-amber-800 dark:text-amber-300"
                  }`}
                >
                  <span>💾</span>
                  <span className="truncate">
                    {activeSavedOrderName ? `Perbarui (${activeSavedOrderName})` : "Simpan Pesanan"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileCartOpen(false);
                    setIsPaymentOpen(true);
                  }}
                  className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition cursor-pointer active:scale-98 flex items-center justify-center gap-1.5"
                >
                  <span>💳</span> Bayar Sekarang
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SIMPAN PESANAN */}
      <SaveOrderModal
        isOpen={isSaveOrderOpen}
        onClose={() => setIsSaveOrderOpen(false)}
      />

      {/* MODAL DAFTAR PESANAN TERSIMPAN */}
      <SavedOrdersModal
        isOpen={isSavedOrdersOpen}
        onClose={() => setIsSavedOrdersOpen(false)}
        onOpenPayment={() => setIsPaymentOpen(true)}
      />

      {/* MODAL PEMBAYARAN */}
      <PaymentModal
        isOpen={isPaymentOpen}
        totalAmount={total}
        queueNumber={currentQueueNumber}
        itemCount={totalItemCount}
        onClose={() => setIsPaymentOpen(false)}
        onSuccess={handlePaymentSuccess}
      />

      {/* MODAL STRUK */}
      <ReceiptModal
        transaction={completedTx}
        onClose={() => setCompletedTx(null)}
      />
    </div>
  );
};
