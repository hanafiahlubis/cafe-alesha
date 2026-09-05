"use client";

import React, { useState, useMemo } from "react";
import { usePOS } from "@/context/POSContext";
import { CategoryType, MenuItem, PaymentMethod, Transaction } from "@/types/pos";
import { PaymentModal } from "./PaymentModal";
import { ReceiptModal } from "./ReceiptModal";

export const PosTerminal: React.FC = () => {
  const {
    menuList,
    cart,
    currentQueueNumber,
    isMobileCartOpen,
    setIsMobileCartOpen,
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

  // Filtered menu
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
        return "🍽️";
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F7FF] dark:bg-slate-950 pt-16 sm:pt-20 pb-24 lg:pb-12 text-slate-900 dark:text-slate-50 transition-colors duration-200">
      <div className="mx-auto max-w-7xl px-2 sm:px-4 lg:px-8">
        {/* Top Info Banner - Ultra compact on mobile to save vertical space */}
        <div className="mb-2.5 sm:mb-4 flex items-center justify-between gap-2 rounded-2xl bg-white dark:bg-slate-900 p-2.5 sm:p-4 shadow-sm border border-blue-100 dark:border-slate-800">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20 text-sm sm:text-xl">
              🏪
            </div>
            <div className="min-w-0">
              <h1 className="text-xs sm:text-lg font-black text-slate-900 dark:text-white leading-tight truncate">
                Menu Kasir (POS)
              </h1>
              <p className="text-[10px] text-slate-400 truncate hidden sm:block">
                Pilih menu dan konfirmasi pembayaran
              </p>
            </div>
          </div>

          {/* Antrean Otomatis Display */}
          <div className="flex items-center gap-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 px-2.5 py-1 sm:px-3 sm:py-1.5 shrink-0">
            <div className="text-right">
              <span className="text-[8px] sm:text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                Antrean
              </span>
              <span className="text-sm sm:text-xl font-black text-blue-700 dark:text-blue-300 leading-none">
                {currentQueueNumber}
              </span>
            </div>
            <span className="inline-flex h-2 w-2 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
            </span>
          </div>
        </div>

        {/* Main Layout: Grid Catalog + Sticky Cart on Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-5 items-start">
          {/* Left Column: Menu Catalog */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-2.5 sm:space-y-4">
            {/* Category Tabs & Search Bar */}
            <div className="rounded-2xl bg-white dark:bg-slate-900 p-2.5 sm:p-3.5 shadow-sm border border-blue-100 dark:border-slate-800 space-y-2">
              {/* Category Horizontal Scroll Pills */}
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
                      className={`flex items-center gap-1 rounded-xl px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-[11px] sm:text-xs font-bold whitespace-nowrap transition cursor-pointer active:scale-95 shrink-0 ${
                        isActive
                          ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                          : "bg-sky-50/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-100/70 dark:hover:bg-slate-700 border border-blue-100 dark:border-transparent"
                      }`}
                    >
                      <span className="text-xs">
                        {cat === "Semua" ? "✨" : getCategoryIcon(cat as CategoryType)}
                      </span>
                      <span>{cat}</span>
                      <span
                        className={`rounded-full px-1.5 py-0.2 text-[9px] font-bold ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-blue-100 dark:bg-slate-700 text-blue-700 dark:text-slate-400"
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
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari menu..."
                  className="w-full rounded-xl border border-blue-200/80 dark:border-slate-800 bg-sky-50/40 dark:bg-slate-800/60 pl-8 pr-3 py-1.5 sm:py-2 text-xs text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            {/* Menu Grid: Perfectly fits 320px screens in 2 columns */}
            <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-3.5">
              {filteredMenu.map((item) => {
                const isHabis = item.status === "Habis";
                return (
                  <div
                    key={item.id}
                    onClick={() => !isHabis && addToCart(item)}
                    className={`group relative flex flex-col justify-between rounded-2xl bg-white dark:bg-slate-900 p-2 sm:p-3 border transition shadow-sm shadow-blue-500/5 ${
                      isHabis
                        ? "opacity-60 border-slate-200 dark:border-slate-800 cursor-not-allowed bg-slate-100/50 dark:bg-slate-900/50"
                        : "border-blue-100/90 dark:border-slate-800 hover:border-blue-400 hover:shadow-md hover:shadow-blue-500/10 cursor-pointer active:scale-98"
                    }`}
                  >
                    <div>
                      {/* Category & Status Badge - Truncated cleanly to avoid wrapping at 320px */}
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[9px] font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded-md truncate max-w-[62%] border border-blue-100/80 dark:border-transparent">
                          {getCategoryIcon(item.category)} {item.category}
                        </span>
                        {isHabis ? (
                          <span className="shrink-0 text-[8px] font-black text-white bg-rose-500 px-1.5 py-0.5 rounded uppercase tracking-wider">
                            HABIS
                          </span>
                        ) : (
                          <span className="shrink-0 text-[8px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-transparent">
                            Tersedia
                          </span>
                        )}
                      </div>

                      {/* Name & Description */}
                      <h3 className="font-bold text-slate-900 dark:text-white text-[11px] sm:text-sm group-hover:text-blue-600 transition leading-snug line-clamp-2 min-h-[1.9rem]">
                        {item.name}
                      </h3>
                      <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5 hidden sm:block">
                        {item.description}
                      </p>
                    </div>

                    {/* Price & Add Button */}
                    <div className="mt-2 flex items-center justify-between pt-1.5 border-t border-blue-50 dark:border-slate-800 gap-1">
                      <span className="text-[11px] sm:text-sm font-black text-blue-600 dark:text-blue-400 truncate">
                        {formatIDR(item.price)}
                      </span>
                      <button
                        type="button"
                        disabled={isHabis}
                        aria-label={`Tambah ${item.name}`}
                        className={`flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-lg font-bold text-xs sm:text-sm transition ${
                          isHabis
                            ? "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                            : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-600/20 group-hover:scale-105 active:scale-95 cursor-pointer"
                        }`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredMenu.length === 0 && (
              <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 sm:p-12 text-center border border-blue-100 dark:border-slate-800 shadow-sm">
                <span className="text-2xl sm:text-4xl">🔍</span>
                <h4 className="mt-2 text-xs sm:text-base font-bold text-slate-900 dark:text-white">
                  Menu Tidak Ditemukan
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Coba kata kunci lain atau tab yang berbeda.
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Order Cart (Desktop: Visible, Mobile: Hidden) */}
          <div className="hidden lg:block lg:col-span-5 xl:col-span-4 sticky top-24">
            <div className="rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-blue-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[calc(100vh-7rem)]">
              {/* Cart Header */}
              <div className="p-4 bg-gradient-to-r from-blue-600 to-sky-600 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🛒</span>
                  <div>
                    <h2 className="font-bold text-base leading-tight">
                      Keranjang Pesanan
                    </h2>
                    <span className="text-[11px] text-blue-100">
                      Antrean: <strong className="text-white">{currentQueueNumber}</strong> (Tanpa Meja)
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

              {/* Cart Items List */}
              <div className="flex-1 overflow-y-auto p-4 divide-y divide-blue-50 dark:divide-slate-800">
                {cart.length === 0 ? (
                  <div className="py-12 text-center space-y-2">
                    <span className="text-4xl opacity-50">🧾</span>
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                      Keranjang Masih Kosong
                    </p>
                    <p className="text-xs text-slate-400 max-w-[200px] mx-auto">
                      Klik menu makanan / minuman di samping untuk menambahkan pesanan.
                    </p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.menuItem.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {item.menuItem.name}
                        </h4>
                        <span className="text-xs text-slate-500 font-medium">
                          {formatIDR(item.menuItem.price)}
                        </span>
                      </div>

                      {/* Quantity Stepper */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.menuItem.id, -1)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-300 hover:bg-sky-100 dark:hover:bg-slate-700 transition cursor-pointer border border-blue-100 dark:border-transparent"
                        >
                          -
                        </button>
                        <span className="w-6 text-center font-bold text-sm text-slate-900 dark:text-white">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.menuItem.id, 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/60 font-bold text-blue-700 dark:text-blue-300 hover:bg-blue-200 transition cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      {/* Subtotal & Delete */}
                      <div className="text-right min-w-[70px]">
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          {formatIDR(item.menuItem.price * item.quantity)}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.menuItem.id)}
                          className="text-[10px] text-rose-500 hover:underline mt-0.5 cursor-pointer"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Cart Footer / Checkout */}
              {cart.length > 0 && (
                <div className="p-4 bg-sky-50/60 dark:bg-slate-800/80 border-t border-blue-100 dark:border-slate-800 space-y-3">
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Total Item:</span>
                      <span className="font-semibold">{totalItemCount} pcs</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Subtotal:</span>
                      <span className="font-semibold">{formatIDR(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-base font-extrabold text-slate-900 dark:text-white border-t border-blue-200/80 dark:border-slate-700 pt-1.5">
                      <span>TOTAL BAYAR:</span>
                      <span className="text-blue-600 dark:text-blue-400">
                        {formatIDR(total)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsPaymentOpen(true)}
                    className="w-full rounded-xl bg-blue-600 py-3.5 text-base font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <span>💳</span> Lanjut Bayar ({formatIDR(total)})
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Bottom Cart Pill on Mobile (lg:hidden) - Positioned cleanly above MobileBottomNav */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-[3.75rem] left-2 right-2 sm:left-4 sm:right-4 z-30 animate-fadeIn">
          <button
            type="button"
            onClick={() => setIsMobileCartOpen(true)}
            className="w-full rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-600 to-sky-600 py-2.5 px-3 sm:px-4 text-white shadow-xl shadow-blue-600/30 flex items-center justify-between font-bold cursor-pointer active:scale-98 border border-blue-400/40"
          >
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="bg-white/20 rounded-md sm:rounded-lg px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-black">
                {totalItemCount} item
              </span>
              <span className="text-[10px] sm:text-xs text-blue-100">Antrean {currentQueueNumber}</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-xs sm:text-sm font-black">{formatIDR(total)}</span>
              <span className="text-[10px] sm:text-xs bg-white text-blue-700 px-2 py-1 rounded-md sm:rounded-lg shadow-sm font-bold">
                Pesanan 🛒 →
              </span>
            </div>
          </button>
        </div>
      )}

      {/* Mobile Cart Bottom Sheet / Drawer Modal */}
      {isMobileCartOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-h-[85vh] rounded-t-3xl bg-white dark:bg-slate-900 shadow-2xl border-t border-blue-100 dark:border-slate-800 flex flex-col overflow-hidden">
            {/* Handle bar */}
            <div className="pt-2 pb-1 bg-gradient-to-r from-blue-600 to-sky-600">
              <div className="w-10 h-1 bg-white/40 rounded-full mx-auto"></div>
            </div>

            {/* Drawer Header */}
            <div className="p-3.5 bg-gradient-to-r from-blue-600 to-sky-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🛒</span>
                <div>
                  <h3 className="font-bold text-sm sm:text-base">Keranjang Pesanan</h3>
                  <p className="text-[10px] sm:text-xs text-blue-100">Antrean {currentQueueNumber} (Tanpa Meja)</p>
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

            {/* Drawer Items List */}
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

            {/* Drawer Checkout Action */}
            <div className="p-3 sm:p-4 bg-sky-50/60 dark:bg-slate-800/80 border-t border-blue-100 dark:border-slate-800 space-y-2 pb-6">
              <div className="flex justify-between items-baseline text-slate-900 dark:text-white">
                <span className="text-[11px] text-slate-500 font-semibold">Total Tagihan:</span>
                <span className="text-base sm:text-xl font-black text-blue-600 dark:text-blue-400">
                  {formatIDR(total)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsMobileCartOpen(false);
                  setIsPaymentOpen(true);
                }}
                className="w-full rounded-xl bg-blue-600 py-3 text-sm sm:text-base font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition cursor-pointer active:scale-98"
              >
                Lanjut ke Pembayaran
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentOpen}
        totalAmount={total}
        queueNumber={currentQueueNumber}
        itemCount={totalItemCount}
        onClose={() => setIsPaymentOpen(false)}
        onSuccess={handlePaymentSuccess}
      />

      {/* Receipt Pop-up Modal */}
      <ReceiptModal
        transaction={completedTx}
        onClose={() => setCompletedTx(null)}
      />
    </div>
  );
};
