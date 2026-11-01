"use client";

import React from "react";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  itemsPerPageOptions?: number[];
  itemName?: string;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
  onItemsPerPageChange,
  itemsPerPageOptions = [5, 10, 20, 50],
  itemName = "data",
  className = "",
}) => {
  if (totalPages <= 1 && (!totalItems || totalItems <= (itemsPerPage || 10))) {
    if (totalItems && totalItems > 0) {
      return (
        <div className={`flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-3 py-2.5 border-t border-blue-50 dark:border-slate-800 ${className}`}>
          <span>
            Total: <strong>{totalItems}</strong> {itemName}
          </span>
        </div>
      );
    }
    return null;
  }

  const startItem = itemsPerPage ? (currentPage - 1) * itemsPerPage + 1 : 1;
  const endItem =
    itemsPerPage && totalItems !== undefined
      ? Math.min(currentPage * itemsPerPage, totalItems)
      : undefined;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    return pages;
  };

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3 px-3 py-2.5 sm:py-3 bg-white dark:bg-slate-900 border-t border-blue-100 dark:border-slate-800 rounded-b-2xl ${className}`}
    >
      {/* Keterangan Jumlah Data & Pilihan per halaman */}
      <div className="flex items-center justify-between w-full sm:w-auto gap-2 text-xs text-slate-500 dark:text-slate-400">
        <div>
          {totalItems !== undefined && itemsPerPage !== undefined ? (
            <span className="text-[11px] sm:text-xs">
              Menampilkan <strong>{totalItems === 0 ? 0 : startItem}</strong>-<strong>{endItem}</strong> dari <strong>{totalItems}</strong> {itemName}
            </span>
          ) : (
            <span className="text-[11px] sm:text-xs">
              Halaman <strong>{currentPage}</strong> dari <strong>{totalPages}</strong>
            </span>
          )}
        </div>

        {onItemsPerPageChange && itemsPerPage && (
          <div className="flex items-center gap-1 shrink-0 text-xs">
            <span className="hidden sm:inline text-slate-400 text-[11px]">Baris:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                onItemsPerPageChange(Number(e.target.value));
                onPageChange(1);
              }}
              className="rounded-lg border border-blue-200 dark:border-slate-700 bg-sky-50/50 dark:bg-slate-800 px-1.5 py-0.5 sm:py-1 text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              {itemsPerPageOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}/hal
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Navigasi Tombol Pagination */}
      <div className="flex items-center justify-between sm:justify-end gap-1 sm:gap-1.5 w-full sm:w-auto">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className={`flex items-center justify-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition active:scale-95 cursor-pointer ${
            currentPage <= 1
              ? "opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-800"
              : "bg-sky-50 dark:bg-slate-800 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-slate-700 hover:bg-blue-100/70 dark:hover:bg-slate-700"
          }`}
          aria-label="Halaman Sebelumnya"
        >
          <span>‹</span>
          <span className="hidden sm:inline">Sebelumnya</span>
        </button>

        {/* Tampilan di HP (Mobile): Compact Pager or Select */}
        <div className="sm:hidden flex items-center gap-1">
          {totalPages <= 4 ? (
            getPageNumbers().map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => typeof p === "number" && onPageChange(p)}
                className={`min-w-[28px] h-7 px-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  p === currentPage
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-sky-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-blue-100 dark:border-slate-700"
                }`}
              >
                {p}
              </button>
            ))
          ) : (
            <div className="flex items-center gap-1">
              <select
                value={currentPage}
                onChange={(e) => onPageChange(Number(e.target.value))}
                className="h-7 rounded-lg border border-blue-200 dark:border-slate-700 bg-sky-50/60 dark:bg-slate-800 px-2 text-[11px] font-bold text-blue-700 dark:text-blue-300 focus:outline-none cursor-pointer"
              >
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                  <option key={pg} value={pg}>
                    Hlm {pg} dari {totalPages}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Tampilan di Layar Sedang & Lebar */}
        <div className="hidden sm:flex items-center gap-1">
          {getPageNumbers().map((p, idx) => {
            if (p === "...") {
              return (
                <span key={idx} className="px-1.5 py-1 text-xs text-slate-400 select-none">
                  ...
                </span>
              );
            }
            const isCurrent = p === currentPage;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => onPageChange(Number(p))}
                className={`min-w-[32px] h-7 sm:h-8 px-2 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer ${
                  isCurrent
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 font-black"
                    : "bg-sky-50/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-blue-100 dark:border-slate-700 hover:bg-blue-100/60 dark:hover:bg-slate-700"
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className={`flex items-center justify-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition active:scale-95 cursor-pointer ${
            currentPage >= totalPages
              ? "opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-800"
              : "bg-sky-50 dark:bg-slate-800 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-slate-700 hover:bg-blue-100/70 dark:hover:bg-slate-700"
          }`}
          aria-label="Halaman Selanjutnya"
        >
          <span className="hidden sm:inline">Selanjutnya</span>
          <span>›</span>
        </button>
      </div>
    </div>
  );
};

export default Pagination;
