import { FAQ } from "@/types/faq";

const faqData: FAQ[] = [
  {
    id: 1,
    quest: "Bagaimana cara menyambungkan database Neon.tech ke proyek ini?",
    ans: "Buka file .env dan masukkan connection string PostgreSQL Anda pada variabel DATABASE_URL.",
  },
  {
    id: 2,
    quest: "Di mana saya bisa mengunggah QRIS toko sendiri?",
    ans: "Kunjungi halaman /upload-qris dari menu navigasi atau header untuk mengunggah foto QRIS pembayaran toko Anda.",
  },
  {
    id: 3,
    quest: "Apakah data transaksi dan menu tersimpan ke NeonDB?",
    ans: "Ya! Seluruh operasi menu, order transaksi, dan pengaturan toko tersambung dengan API backend dan database NeonDB.",
  },
];

export default faqData;
