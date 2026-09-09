# Aplikasi POS Kasir Modern Next.js (Tema Biru Muda & Putih) + NeonDB

Aplikasi Web Kasir Point of Sale (POS) modern berbasis **Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Prisma ORM, dan Neon PostgreSQL**.

---

### Fitur Baru: Hit API & Halaman `/upload-qris`

1. **Endpoint API Terintegrasi NeonDB (`/api/...`)**:
   - `GET /api/settings` & `PUT /api/settings`: Mengambil dan memperbarui informasi toko serta URL QRIS.
   - `POST /api/upload-qris` & `DELETE /api/upload-qris`: Mengunggah gambar QRIS pembayaran merchant toko dan menyimpannya ke database NeonDB.
   - `GET /api/menus` & `POST /api/menus`: Mengambil katalog menu dan menambah menu baru.
   - `PUT /api/menus/[id]` & `DELETE /api/menus/[id]`: Mengedit menu, mengubah status ketersediaan (Tersedia / Habis), serta menghapus menu.
   - `GET /api/orders` & `POST /api/orders`: Menyimpan transaksi kasir, nomor antrean otomatis, rincian pesanan, dan mengambil data rekap riwayat penjualan.

2. **Halaman `/upload-qris` & Pengaturan Toko**:
   - Formulir unggah gambar QRIS toko sendiri (PNG, JPG, WEBP maks 3MB) dengan drag-and-drop.
   - Formulir pengaturan nama toko, alamat lengkap, nomor telepon, dan NMID merchant QRIS.
   - Tombol 1-klik untuk reset kembali ke template standar QRIS BCA.
   - Pratinjau interaktif real-time bagaimana QRIS toko muncul di layar kasir saat pelanggan memilih metode bayar QRIS.
   - Pratinjau kepala struk cetak thermal (58mm / 80mm).

3. **Sinkronisasi Otomatis POSContext**:
   - Menggunakan pendekatan *offline-first* dengan cache lokal di `localStorage` sekaligus menyinkronkan seluruh perubahan ke NeonDB saat terhubung internet.

---

### Cara Menjalankan Proyek

1. **Ekstrak File ZIP**:
   ```bash
   unzip pos-kasir-nextjs-blue.zip
   cd pos-kasir-nextjs-blue
   ```

2. **Instal Dependensi**:
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Sinkronisasi Skema ke NeonDB**:
   ```bash
   npx prisma db push
   ```

4. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

5. **Jalankan Server Development**:
   ```bash
   npm run dev
   ```

6. **Akses di Browser**:
   - Kasir POS: [http://localhost:3000](http://localhost:3000)
   - Upload QRIS: [http://localhost:3000/upload-qris](http://localhost:3000/upload-qris)
   - Kelola Menu: [http://localhost:3000/kelola-menu](http://localhost:3000/kelola-menu)
   - Riwayat Penjualan: [http://localhost:3000/riwayat](http://localhost:3000/riwayat)
