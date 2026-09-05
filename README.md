# Aplikasi POS Kasir Modern Next.js (Tema Biru Muda & Putih)

Aplikasi Web Kasir Point of Sale (POS) modern berbasis **Next.js 15, React 19, TypeScript, dan Tailwind CSS** yang dirancang khusus untuk operasional kasir Cafe, Restoran, atau Warung Makan dengan tampilan Desktop & Mobile Smartphone yang sangat responsif, indah, dan nyaman digunakan.

---

## 🌟 Fitur & Pembaruan Terbaru

### 1. Tampilan Responsif & Cantik untuk Versi Mobile
- **Mobile Bottom Navigation Bar**: Menu navigasi bawah layar ponsel (Kasir, Menu, Riwayat, QRIS) dengan ikon modern dan badge jumlah item keranjang otomatis.
- **Floating Bottom Cart Pill**: Ketika ada item di keranjang belanja, muncul tombol mengambang interaktif di bagian bawah layar yang menampilkan jumlah item, total harga, dan tombol "Lihat Pesanan 🛒 →".
- **Bottom Drawer Cart**: Panel laci keranjang belanja yang membuka ke atas dengan animasi halus, stepper penambahan/pengurangan jumlah item, dan tombol pembayaran.
- **Mobile Grid & Cards**: Tata letak 2 kolom rapi pada layar smartphone untuk katalog menu, kartu transaksi riwayat yang jelas, serta kartu kelola menu dengan tombol toggle status 1-klik.

### 2. Tema Terang: Biru Muda & Putih (Light Theme)
- Nuansa warna terang dirancang khusus dengan perpaduan **Biru Muda Lembut (`#F0F7FF`)** dan **Putih Bersih (`#FFFFFF`)**, beraksen biru langit (`#0284C7` & `#38BDF8`).
- Dilengkapi tombol toggle Matahari / Bulan di header untuk beralih instan antara **Mode Terang (Biru Muda & Putih)** dan **Mode Gelap (Dark Navy)**. Preferensi tema tersimpan otomatis di browser.

### 3. Upload QRIS & Pengaturan Toko (`/upload-qris`)
- Halaman `/database-info` telah diperbarui dan diarahkan sepenuhnya menjadi `/upload-qris`.
- **Upload QRIS Toko Sendiri**: Unggah gambar QRIS pembayaran toko (PNG, JPG, WEBP) hingga 3MB dengan preview interaktif yang langsung muncul di layar kasir secara real-time.
- **Reset ke QRIS Standar**: 1-klik untuk kembali ke template QRIS BCA bawaan.
- **Pengaturan Identitas Struk**: Ubah nama toko/cafe, alamat lengkap, nomor telepon, dan NMID merchant yang langsung tercetak di struk kasir.

### 4. Tombol Masuk & Daftar Dihapus
- Tombol "Masuk" dan "Daftar" pada header desktop dan laci menu ponsel telah dihapus agar antarmuka fokus 100% pada fungsi kasir POS.

### 5. Filter Riwayat Penjualan dengan Dropdown Tanggal, Bulan, dan Tahun
- Pada halaman `/riwayat`, kini tersedia 3 dropdown terintegrasi:
  - **Dropdown Tanggal**: Pilihan "Semua Tanggal (Rekap 1 Bulan Penuh)" atau tanggal spesifik (Tanggal 01 s/d Tanggal 31, disesuaikan dengan jumlah hari dalam bulan terpilih).
  - **Dropdown Bulan**: Januari hingga Desember.
  - **Dropdown Tahun**: Pilihan tahun berjalan dan riwayat transaksi.
- Tombol cepat **"Hari Ini"** dan **"Bulan Ini"** untuk filter instan 1-klik.
- Rekap keuangan otomatis menghitung Total Pemasukan, Total Transaksi, Pemasukan Tunai (Cash), Pemasukan QRIS, rasio persentase, dan daftar rincian transaksi per periode terpilih.

### 6. Tombol Pembayaran "Konfirmasi Bayar" & Pop-up Struk
- Tombol pembayaran seragam menggunakan teks **"Konfirmasi Bayar"**.
- Setelah pembayaran berhasil, struk transaksi otomatis muncul dalam bentuk Pop-up Modal elegan di layar (tanpa auto-print browser), dilengkapi tombol "Selesai & Transaksi Baru" serta tombol opsional cetak struk thermal.

---

## 🚀 Cara Menjalankan Proyek di Komputer Lokal

1. **Ekstrak File ZIP**:
   Ekstrak file `pos-kasir-nextjs-blue.zip`.
2. **Masuk ke Direktori Proyek**:
   ```bash
   cd pos-kasir-nextjs-blue
   ```
3. **Instal Dependensi**:
   ```bash
   npm install --legacy-peer-deps
   ```
4. **Jalankan Server Development**:
   ```bash
   npm run dev
   ```
5. **Buka di Browser**:
   Akses [http://localhost:3000](http://localhost:3000).
