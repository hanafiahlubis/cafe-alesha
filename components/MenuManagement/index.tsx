"use client";

import React, { useState, useMemo, useEffect } from "react";
import { usePOS } from "@/context/POSContext";
import { MenuItem, CategoryType, MenuStatus } from "@/types/pos";
import { Pagination } from "@/components/Common/Pagination";

export const MenuManagement: React.FC = () => {
  const { menuList, addMenu, updateMenu, toggleMenuStatus, deleteMenu } = usePOS();
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | "Semua">("Semua");
  const [search, setSearch] = useState<string>("");

  // State Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // State Modal Tambah / Edit
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [name, setName] = useState<string>("");
  const [category, setCategory] = useState<CategoryType>("Minuman");
  const [price, setPrice] = useState<string>("");
  const [hpp, setHpp] = useState<string>(""); // Field HPP Opsional
  const [description, setDescription] = useState<string>("");
  const [status, setStatus] = useState<MenuStatus>("Tersedia");

  // State Modal Konfirmasi Hapus (Icon Sampah)
  const [deleteTarget, setDeleteTarget] = useState<MenuItem | null>(null);

  const categories: (CategoryType | "Semua")[] = [
    "Semua",
    "Minuman",
    "Makanan Ringan",
    "Makanan Berat",
  ];

  const filteredMenu = useMemo(() => {
    return menuList.filter((m) => {
      const matchCat = selectedCategory === "Semua" ? true : m.category === selectedCategory;
      const matchSearch =
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        (m.description && m.description.toLowerCase().includes(search.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [menuList, selectedCategory, search]);

  // Reset pagination ke halaman 1 saat filter atau pencarian berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, search]);

  const totalPages = Math.ceil(filteredMenu.length / itemsPerPage) || 1;

  const paginatedMenu = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredMenu.slice(start, start + itemsPerPage);
  }, [filteredMenu, currentPage, itemsPerPage]);

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);
  };

  const openAddModal = () => {
    setEditingItem(null);
    setName("");
    setCategory("Minuman");
    setPrice("");
    setHpp("");
    setDescription("");
    setStatus("Tersedia");
    setIsModalOpen(true);
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setName(item.name);
    setCategory(item.category);
    setPrice(item.price.toString());
    setHpp(item.hpp ? item.hpp.toString() : "");
    setDescription(item.description || "");
    setStatus(item.status);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numPrice = parseInt(price.replace(/\D/g, ""), 10) || 0;
    const numHpp = hpp ? parseInt(hpp.replace(/\D/g, ""), 10) : undefined;
    if (!name || numPrice <= 0) return;

    if (editingItem) {
      await updateMenu({
        ...editingItem,
        name,
        category,
        price: numPrice,
        hpp: numHpp,
        description,
        status,
      });
    } else {
      await addMenu({
        name,
        category,
        price: numPrice,
        hpp: numHpp,
        description,
        status,
      });
    }
    setIsModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (deleteTarget) {
      await deleteMenu(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F7FF] dark:bg-slate-950 pt-16 sm:pt-20 pb-20 text-slate-900 dark:text-slate-50 transition-colors duration-200">
      <div className="mx-auto max-w-7xl px-2.5 sm:px-6 lg:px-8 space-y-3 sm:space-y-4">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 rounded-2xl bg-white dark:bg-slate-900 p-3 sm:p-4 shadow-sm border border-blue-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl">📋</span>
              <h1 className="text-sm sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                Kelola Menu &amp; Harga (NeonDB)
              </h1>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">
              Tambah menu baru, atur harga, dan status ketersediaan Tersedia / Habis.
            </p>
          </div>
          <button
            type="button"
            onClick={openAddModal}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-3 py-2 sm:px-4 sm:py-2 text-xs font-bold text-white shadow-md shadow-blue-600/25 transition active:scale-95 cursor-pointer shrink-0 w-full sm:w-auto"
          >
            <span className="text-base leading-none">+</span>
            <span>Tambah Menu</span>
          </button>
        </div>

        {/* KATEGORI FILTER & SEARCH RESPONSIF UNTUK HP */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 rounded-2xl bg-white dark:bg-slate-900 p-3 sm:p-3.5 shadow-sm border border-blue-100 dark:border-slate-800">
          {/* Scroll Kategori Horizontal untuk HP */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar w-full sm:w-auto -mx-1 px-1">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              const count =
                cat === "Semua"
                  ? menuList.length
                  : menuList.filter((m) => m.category === cat).length;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-xl px-2.5 py-1.5 text-xs font-bold whitespace-nowrap transition cursor-pointer active:scale-95 shrink-0 flex items-center gap-1 ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-sky-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-100/60 border border-blue-100 dark:border-transparent"
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-blue-100/70 text-blue-700 dark:bg-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Kolom Pencarian */}
          <div className="w-full sm:w-64 relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama menu..."
              className="w-full rounded-xl border border-blue-200 dark:border-slate-800 bg-sky-50/40 dark:bg-slate-800/60 pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
            />
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
              🔍
            </span>
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* CONTAINER DAFTAR MENU (DENGAN PAGINATION DI SEMUA TAMPILAN) */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-blue-100 dark:border-slate-800 overflow-hidden">
          {/* TAMPILAN KHUSUS HP (MOBILE CARD VIEW) */}
          <div className="grid grid-cols-1 gap-2 p-2.5 sm:hidden divide-y divide-blue-50 dark:divide-slate-800/60">
            {paginatedMenu.map((item) => {
              const isHabis = item.status === "Habis";
              return (
                <div
                  key={item.id}
                  className="rounded-xl bg-sky-50/30 dark:bg-slate-800/40 p-3 border border-blue-100/70 dark:border-slate-800/80 shadow-xs flex flex-col justify-between gap-2.5 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-md border border-blue-200/60 dark:border-transparent inline-block mb-1">
                        {item.category}
                      </span>
                      <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-snug">
                        {item.name}
                      </h3>
                      {item.description && (
                        <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs sm:text-sm font-black text-blue-600 dark:text-blue-400">
                        {formatIDR(item.price)}
                      </span>
                      {item.hpp && (
                        <span className="block text-[9px] text-slate-400 font-medium">
                          HPP: {formatIDR(item.hpp)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Baris Tombol Aksi HP: Toggle Status & Edit/Hapus */}
                  <div className="flex items-center justify-between pt-2 border-t border-blue-100/70 dark:border-slate-800 gap-1.5">
                    <button
                      type="button"
                      onClick={() => toggleMenuStatus(item.id)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold cursor-pointer transition active:scale-95 shrink-0 shadow-xs ${
                        isHabis
                          ? "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/80 dark:text-rose-400"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-400"
                      }`}
                      title="Klik untuk ubah status Tersedia / Habis"
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${
                          isHabis ? "bg-rose-500 animate-pulse" : "bg-emerald-500"
                        }`}
                      ></span>
                      <span>{item.status}</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        className="rounded-xl bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-700 px-3 py-1.5 text-xs font-bold text-blue-700 dark:text-blue-300 hover:bg-blue-100 transition active:scale-95 cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(item)}
                        className="rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 px-2.5 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition active:scale-95 cursor-pointer"
                        title="Hapus Menu"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* TAMPILAN TABLE DESKTOP / TABLET */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-sky-50/40 dark:bg-slate-800/50 text-xs uppercase text-slate-500 font-semibold border-b border-blue-100 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">MENU</th>
                  <th className="px-6 py-4">KATEGORI</th>
                  <th className="px-6 py-4">HARGA</th>
                  <th className="px-6 py-4">STATUS KETERSEDIAAN</th>
                  <th className="px-6 py-4 text-right">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-50 dark:divide-slate-800">
                {paginatedMenu.map((item) => {
                  const isHabis = item.status === "Habis";
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-blue-50/30 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {item.name}
                        </div>
                        {item.description && (
                          <div className="text-xs text-slate-400 line-clamp-1">
                            {item.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded-full bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {formatIDR(item.price)}
                        </div>
                        {item.hpp && (
                          <div className="text-[10px] text-slate-400 font-medium">
                            HPP: {formatIDR(item.hpp)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => toggleMenuStatus(item.id)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition cursor-pointer shadow-xs ${
                            isHabis
                              ? "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-400"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-400"
                          }`}
                          title="Klik untuk mengubah status ketersediaan"
                        >
                          <span
                            className={`h-2 w-2 rounded-full ${
                              isHabis ? "bg-rose-500 animate-pulse" : "bg-emerald-500"
                            }`}
                          ></span>
                          <span>{item.status} (Klik Toggle)</span>
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="rounded-xl bg-blue-50 dark:bg-slate-800 border border-blue-200/60 dark:border-transparent px-3 py-1.5 text-xs font-bold text-blue-700 dark:text-blue-400 hover:bg-blue-100 transition cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(item)}
                          className="rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-transparent px-3 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition cursor-pointer"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredMenu.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-500">
              Tidak ada menu yang sesuai kriteria pencarian.
            </div>
          )}

          {/* PAGINATION BAR */}
          {filteredMenu.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredMenu.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
              itemName="menu"
            />
          )}
        </div>
      </div>

      {/* MODAL HAPUS DENGAN ICON TEMPAT SAMPAH */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-blue-100 dark:border-slate-800 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/60 mb-3 shadow-sm">
              <svg
                className="h-7 w-7"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Hapus Menu Ini?
            </h3>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Apakah Anda yakin ingin menghapus menu{" "}
              <strong className="text-slate-900 dark:text-slate-100">
                &ldquo;{deleteTarget.name}&rdquo;
              </strong>
              ? Data yang dihapus tidak dapat dikembalikan.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-slate-200 dark:border-slate-700 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white shadow-md shadow-rose-600/30 hover:bg-rose-700 cursor-pointer transition"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL POPUP FORM TAMBAH / EDIT LENGKAP */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md max-h-[92vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-2xl border border-blue-100 dark:border-slate-800 text-slate-800 dark:text-white">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-3">
              {editingItem ? "Edit Menu & Harga" : "Tambah Menu Baru"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Menu *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Kopi Susu Creamy"
                  className="w-full rounded-xl border border-blue-200 dark:border-slate-700 bg-sky-50/30 dark:bg-slate-800 px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kategori *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as CategoryType)}
                  className="w-full rounded-xl border border-blue-200 dark:border-slate-700 bg-sky-50/30 dark:bg-slate-800 px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none cursor-pointer"
                >
                  <option value="Minuman">Minuman</option>
                  <option value="Makanan Ringan">Makanan Ringan</option>
                  <option value="Makanan Berat">Makanan Berat</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Harga Satuan (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Contoh: 18000"
                    className="w-full rounded-xl border border-blue-200 dark:border-slate-700 bg-sky-50/30 dark:bg-slate-800 px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    HPP Modal (Rp) <span className="font-normal text-slate-400">(Opsional)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={hpp}
                    onChange={(e) => setHpp(e.target.value)}
                    placeholder="Contoh: 12000"
                    className="w-full rounded-xl border border-blue-200 dark:border-slate-700 bg-sky-50/30 dark:bg-slate-800 px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Status Ketersediaan
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as MenuStatus)}
                  className="w-full rounded-xl border border-blue-200 dark:border-slate-700 bg-sky-50/30 dark:bg-slate-800 px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none cursor-pointer"
                >
                  <option value="Tersedia">Tersedia</option>
                  <option value="Habis">Habis</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Deskripsi Menu
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Keterangan bahan / rasa..."
                  className="w-full rounded-xl border border-blue-200 dark:border-slate-700 bg-sky-50/30 dark:bg-slate-800 px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                ></textarea>
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
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-md shadow-blue-600/20 cursor-pointer"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};