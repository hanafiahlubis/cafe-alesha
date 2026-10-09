# Aplikasi POS Kasir Modern Next.js (Tema Biru Muda & Putih) + NeonDB

Aplikasi Web Kasir Point of Sale (POS) modern berbasis **Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Prisma ORM, dan Neon PostgreSQL**.

---

### Fitur Terbaru yang Diimplementasikan:

#### 1. Fitur: Simpan dengan Nama Pesanan (Halaman Home / Kasir)
- **Tujuan**: Memungkinkan kasir menahan (*hold*) isi keranjang belanja pelanggan sementara sebelum dibayar, misalnya saat pelanggan masih ingin menambah pesanan atau berpindah meja.
- **Tampilan (UI/UX)**:
  - Tombol **"Simpan Pesanan"** di area bawah keranjang kasir (desktop) dan drawer keranjang mobile.
  - **Modal Simpan Pesanan**: Input nama pesanan/pelanggan (contoh: "Meja 4", "Mas Budi", "Takeaway") dilengkapi tombol pintas (*quick chips*).
  - **Modal Daftar Pesanan Tersimpan**: Popover/modal khusus untuk melihat semua pesanan yang ditahan, dilengkapi rincian item, total harga, pencarian, tombol **"Muat ke Keranjang"**, dan tombol **"Hapus"**.
  - Akses cepat dari tombol header **"📋 Pesanan Tersimpan (X)"** dengan badge jumlah aktif.
- **Database & API**:
  - Tabel `saved_orders` di PostgreSQL dan model `SavedOrder` di Prisma: `id`, `order_name`, `items` (JSON), `total_price`, `created_at`, `updated_at`.
  - Endpoint REST API:
    - `GET /api/saved-orders` (Ambil daftar pesanan tersimpan)
    - `POST /api/saved-orders` (Simpan pesanan baru)
    - `DELETE /api/saved-orders?id=...` & `DELETE /api/saved-orders/[id]` (Hapus pesanan)
  - Dukungan *offline-first* dengan sinkronisasi otomatis ke `localStorage`.

---

#### 2. Fitur: Edit Sisa Saldo Cash & Bank QRIS (Halaman Pengeluaran)
- **Tujuan**: Memungkinkan kasir/pemilik toko mencatat dan menyesuaikan sisa saldo fisik riil yang ada di laci kasir (Cash) dan saldo di rekening bank (Bank QRIS) agar akurat dengan hasil opname fisik kas.
- **Tampilan (UI/UX)**:
  - Pada Halaman Pengeluaran (`/pengeluaran`), ditambahkan 2 bidang/kartu informasi baru:
    1. **Tersisa di Toko (Cash)**: Menampilkan nominal fisik kasir, waktu update terakhir, dan catatan opname.
    2. **Tersisa di Bank (QRIS)**: Menampilkan nominal saldo rekening bank, waktu update terakhir, dan catatan opname.
  - Tombol **Edit** (icon pensil) di dalam masing-masing kartu untuk membuka popup penyesuaian nominal.
  - **Modal Edit Sisa Saldo**: Input nominal rupiah dengan format mata uang otomatis, shortcut nominal (+50rb, +100rb, +500rb, dll.), input catatan opname/alasan penyesuaian, dan tombol simpan.
- **Database & API**:
  - Tabel `balance_adjustments` di PostgreSQL dan model `BalanceAdjustment` di Prisma: `id`, `type` ('CASH'/'QRIS'), `actual_amount`, `note`, `created_at`, `updated_at`.
  - Endpoint REST API:
    - `GET /api/balances` (Ambil saldo riil terkini untuk Cash & QRIS)
    - `POST /api/balances` (Catat penyesuaian saldo riil fisik)
    - Integrasi otomatis dengan response `GET /api/expenses`.
  - Dukungan sinkronisasi cache `localStorage` untuk performa instan tanpa delay.

---

### Fitur Inti Lainnya:

1. **POS Kasir Interaktif**:
   - Pemilihan menu instan, pencarian, filter kategori (Minuman, Makanan Ringan, Makanan Berat).
   - Antrean harian otomatis yang ter-reset setiap hari baru.
   - Metode pembayaran Cash (dengan hitung uang kembali otomatis) dan QRIS interaktif.
   - Cetak struk belanja thermal (58mm / 80mm).

2. **Laporan & Manajemen**:
   - **Kelola Menu** (`/kelola-menu`): Tambah, ubah harga, HPP, status (Tersedia/Habis), dan hapus menu.
   - **Riwayat Penjualan** (`/riwayat`): Riwayat transaksi kasir, filter tanggal, cetak struk ulang, multi-select.
   - **Pengeluaran & Laba Bersih** (`/pengeluaran`): Pencatatan biaya operasional, kalkulasi omzet, HPP, laba bersih, serta kartu saldo riil Cash & Bank QRIS.
   - **Upload QRIS & Pengaturan Toko** (`/upload-qris`): Pengaturan toko dan upload QRIS kustom merchant.

---

### Cara Menjalankan Proyek

1. **Instal Dependensi**:
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Sinkronisasi Skema Database ke NeonDB**:
   ```bash
   npx prisma db push
   # atau jalankan query pada schema.sql langsung di SQL Console NeonDB
   ```

3. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

4. **Jalankan Server Development**:
   ```bash
   npm run dev
   ```

5. **Akses di Browser**:
   - Kasir POS: [http://localhost:3000](http://localhost:3000)
   - Pengeluaran & Sisa Saldo: [http://localhost:3000/pengeluaran](http://localhost:3000/pengeluaran)
   - Kelola Menu: [http://localhost:3000/kelola-menu](http://localhost:3000/kelola-menu)
   - Riwayat Penjualan: [http://localhost:3000/riwayat](http://localhost:3000/riwayat)
   - Upload QRIS: [http://localhost:3000/upload-qris](http://localhost:3000/upload-qris)
