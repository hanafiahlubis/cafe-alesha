import { Menu } from "@/types/menu";

const menuData: Menu[] = [
  {
    id: 1,
    title: "Kasir (POS)",
    newTab: false,
    path: "/",
  },
  {
    id: 2,
    title: "Kelola Menu",
    newTab: false,
    path: "/kelola-menu",
  },
  {
    id: 3,
    title: "Riwayat Penjualan",
    newTab: false,
    path: "/riwayat",
  },
  {
    id: 4,
    title: "Pengeluaran",
    newTab: false,
    path: "/pengeluaran"
  }, // Menu Baru
  {
    id: 5,
    title: "Upload QRIS",
    newTab: false,
    path: "/upload-qris",
  },
];

export default menuData;
