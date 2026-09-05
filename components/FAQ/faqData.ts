import { FAQ } from "@/types/faq";

const faqData: FAQ[] = [
  {
    id: 1,
    quest: "Bagaimana cara menyambungkan database Neon.tech ke proyek ini?",
    ans: "Cukup buka file `.env`, lalu masukkan connection string PostgreSQL Anda pada variabel `DATABASE_URL`. Semua konfigurasi koneksi database siap dipakai oleh ORM pilihan Anda.",
  },
  {
    id: 2,
    quest: "Apakah template ini sudah mendukung Dark Mode?",
    ans: "Ya, template ini sudah dilengkapi dengan ThemeToggler berbasis `next-themes` yang otomatis mengingat preferensi pengguna dan tema sistem perangkat.",
  },
  {
    id: 3,
    quest: "Bagaimana cara menjalankan proyek ini di komputer lokal?",
    ans: "Ekstrak file ZIP yang telah diunduh, buka terminal di folder proyek, lalu jalankan `npm install --legacy-peer-deps` dan kemudian `npm run dev`.",
  },
  {
    id: 4,
    quest: "Bagaimana cara mengganti logo atau menyesuaikan warna biru?",
    ans: "File logo berada di folder `public/images/logo/`. Warna aksen biru utama dapat diatur secara terpusat di file `app/globals.css` menggunakan variabel warna Tailwind CSS.",
  },
];

export default faqData;
