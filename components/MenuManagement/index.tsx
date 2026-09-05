"use client";

import React, { useState } from "react";
import { usePOS } from "@/context/POSContext";
import { MenuItem, CategoryType, MenuStatus } from "@/types/pos";

export const MenuManagement: React.FC = () => {
  const { menuList, addMenu, updateMenu, toggleMenuStatus, deleteMenu } = usePOS();
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | "Semua">("Semua");
  const [search, setSearch] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Form states
  const [name, setName] = useState<string>("");
  const [category, setCategory] = useState<CategoryType>("Minuman");
  const [price, setPrice] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [status, setStatus] = useState<MenuStatus>("Tersedia");

  const categories: (CategoryType | "Semua")[] = [
    "Semua",
    "Minuman",
    "Makanan Ringan",
    "Makanan Berat",
  ];

  const filteredMenu = menuList.filter((m) => {
    const matchCat = selectedCategory === "Semua" ? true : m.category === selectedCategory;
    const matchSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

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
    setDescription("");
    setStatus("Tersedia");
    setIsModalOpen(true);
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setName(item.name);
    setCategory(item.category);
    setPrice(item.price.toString());
    setDescription(item.description);
    setStatus(item.status);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numPrice = parseInt(price.replace(/\D/g, ""), 10) || 0;
    if (!name || numPrice <= 0) return;

    if (editingItem) {
      updateMenu({
        ...editingItem,
        name,
        category,
        price: numPrice,
        description,
        status,
      });
    } else {
      addMenu({
        name,
        category,
        price: numPrice,
        description,
        status,
      });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F0F7FF] dark:bg-slate-950 pt-16 sm:pt-20 pb-24 lg:pb-16 text-slate-900 dark:text-slate-50 transition-colors duration-200">
      <div className="mx-auto max-w-7xl px-2 sm:px-4 lg:px-8 space-y-2.5 sm:space-y-4">
        {/* Page Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white dark:bg-slate-900 p-2.5 sm:p-4 shadow-sm border border-blue-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-lg sm:text-2xl">📋</span>
              <h1 className="text-xs sm:text-lg font-black text-slate-900 dark:text-white">
                Kelola Menu &amp; Harga
              </h1>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block mt-0.5">
              Tambah menu baru dan atur status Tersedia / Habis
            </p>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="flex items-center gap-1 rounded-xl bg-blue-600 px-2.5 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-xs font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 transition cursor-pointer active:scale-95 shrink-0"
          >
            <span>+</span> Tambah Menu
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white dark:bg-slate-900 p-2.5 sm:p-3.5 shadow-sm border border-blue-100 dark:border-slate-800">
          {/* Category Pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar w-full sm:w-auto -mx-0.5 px-0.5">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-xl px-2.5 py-1 text-[11px] font-bold whitespace-nowrap transition cursor-pointer active:scale-95 shrink-0 ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-sky-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-100/60 border border-blue-100 dark:border-transparent"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="w-full sm:w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari menu..."
              className="w-full rounded-xl border border-blue-200/80 dark:border-slate-800 bg-sky-50/40 dark:bg-slate-800/60 px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Mobile View: Card List (sm:hidden) */}
        <div className="grid grid-cols-1 gap-2 sm:hidden">
          {filteredMenu.map((item) => {
            const isHabis = item.status === "Habis";
            return (
              <div
                key={item.id}
                className="rounded-2xl bg-white dark:bg-slate-900 p-2.5 border border-blue-100/90 dark:border-slate-800 shadow-sm shadow-blue-500/5 flex flex-col justify-between gap-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-1.5 py-0.5 rounded border border-blue-100 dark:border-transparent inline-block mb-1">
                      {item.category}
                    </span>
                    <h3 className="font-bold text-xs text-slate-900 dark:text-white leading-snug truncate">
                      {item.name}
                    </h3>
                    <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                      {item.description}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-blue-600 dark:text-blue-400">
                      {formatIDR(item.price)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-blue-50 dark:border-slate-800 gap-1">
                  {/* Status Toggle */}
                  <button
                    type="button"
                    onClick={() => toggleMenuStatus(item.id)}
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold cursor-pointer transition shrink-0 ${
                      isHabis
                        ? "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950 dark:text-rose-400"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${isHabis ? "bg-rose-500" : "bg-emerald-500"}`}></span>
                    {item.status} (Toggle)
                  </button>

                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditModal(item)}
                      className="rounded-lg bg-blue-50 dark:bg-slate-800 border border-blue-200/60 dark:border-transparent px-2.5 py-1 text-[11px] font-bold text-blue-700 dark:text-blue-400 cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Hapus menu "${item.name}"?`)) deleteMenu(item.id);
                      }}
                      className="rounded-lg bg-rose-50 dark:bg-rose-950 border border-rose-200/60 dark:border-transparent px-2 py-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 cursor-pointer"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop View: Full Table (hidden sm:block) */}
        <div className="hidden sm:block overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-blue-100 dark:border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-sky-50/40 dark:bg-slate-800/50 text-xs uppercase text-slate-500 font-semibold border-b border-blue-100 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">Menu</th>
                  <th className="px-6 py-4">Kategori</th>
                  <th className="px-6 py-4">Harga</th>
                  <th className="px-6 py-4">Status Ketersediaan</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-50 dark:divide-slate-800">
                {filteredMenu.map((item) => {
                  const isHabis = item.status === "Habis";
                  return (
                    <tr key={item.id} className="hover:bg-blue-50/30 dark:hover:bg-slate-800/40 transition">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {item.name}
                        </div>
                        <div className="text-xs text-slate-400 line-clamp-1">
                          {item.description}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded-full bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                        {formatIDR(item.price)}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => toggleMenuStatus(item.id)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition cursor-pointer ${
                            isHabis
                              ? "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-400"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-400"
                          }`}
                          title="Klik untuk mengubah status ketersediaan"
                        >
                          <span className={`h-2 w-2 rounded-full ${isHabis ? "bg-rose-500" : "bg-emerald-500"}`}></span>
                          {item.status} (Klik Toggle)
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="rounded-lg bg-blue-50 dark:bg-slate-800 border border-blue-200/60 dark:border-transparent px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400 hover:bg-blue-100 transition cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Yakin ingin menghapus menu "${item.name}"?`)) {
                              deleteMenu(item.id);
                            }
                          }}
                          className="rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-transparent px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition cursor-pointer"
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
        </div>

        {filteredMenu.length === 0 && (
          <div className="p-6 text-center text-xs text-slate-500 rounded-2xl bg-white dark:bg-slate-900 border border-blue-100 dark:border-slate-800">
            Tidak ada menu yang sesuai kriteria pencarian.
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-2 sm:p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-2xl border border-blue-100 dark:border-slate-800 text-slate-800 dark:text-white">
            <h3 className="text-sm sm:text-lg font-bold text-slate-900 dark:text-white mb-3">
              {editingItem ? "Edit Menu & Harga" : "Tambah Menu Baru"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-2.5 sm:space-y-3.5">
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
                  className="w-full rounded-xl border border-blue-200 dark:border-slate-700 bg-sky-50/30 dark:bg-slate-800 px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kategori *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as CategoryType)}
                  className="w-full rounded-xl border border-blue-200 dark:border-slate-700 bg-sky-50/30 dark:bg-slate-800 px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="Minuman">Minuman</option>
                  <option value="Makanan Ringan">Makanan Ringan</option>
                  <option value="Makanan Berat">Makanan Berat</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Harga Satuan (Rp) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="500"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Contoh: 18000"
                  className="w-full rounded-xl border border-blue-200 dark:border-slate-700 bg-sky-50/30 dark:bg-slate-800 px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Status Ketersediaan
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as MenuStatus)}
                  className="w-full rounded-xl border border-blue-200 dark:border-slate-700 bg-sky-50/30 dark:bg-slate-800 px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
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
                  className="w-full rounded-xl border border-blue-200 dark:border-slate-700 bg-sky-50/30 dark:bg-slate-800 px-3 py-1.5 sm:py-2 text-xs text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                ></textarea>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl bg-slate-100 dark:bg-slate-800 px-3.5 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-700 shadow-md shadow-blue-600/20 cursor-pointer"
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
