-- SQL DDL SCHEMA UNTUK POS KASIR (POSTGRESQL / NEONDB)
DO $$ BEGIN
    CREATE TYPE "CategoryType" AS ENUM ('MINUMAN', 'MAKANAN_RINGAN', 'MAKANAN_BERAT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "MenuStatus" AS ENUM ('TERSEDIA', 'HABIS');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'QRIS');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "OrderStatus" AS ENUM ('COMPLETED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "BalanceType" AS ENUM ('CASH', 'QRIS');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Tabel Pengaturan Toko & Upload QRIS
CREATE TABLE IF NOT EXISTS "store_settings" (
    "id" VARCHAR(36) PRIMARY KEY,
    "store_name" VARCHAR(150) NOT NULL DEFAULT 'CAFE & RESTO BIRU',
    "store_address" TEXT DEFAULT 'Jl. Melati No. 12, Jakarta',
    "store_phone" VARCHAR(50) DEFAULT '0812-3456-7890',
    "qris_image_url" TEXT,
    "qris_nmid" VARCHAR(50) DEFAULT 'ID1020030040050',
    "qris_merchant_name" VARCHAR(150) DEFAULT 'KASIR CAFE & RESTO BIRU',
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel Kategori
CREATE TABLE IF NOT EXISTS "categories" (
    "id" VARCHAR(36) PRIMARY KEY,
    "name" VARCHAR(100) NOT NULL UNIQUE,
    "slug" VARCHAR(100) NOT NULL UNIQUE,
    "type" "CategoryType" NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabel Menu
CREATE TABLE IF NOT EXISTS "menus" (
    "id" VARCHAR(36) PRIMARY KEY,
    "name" VARCHAR(150) NOT NULL,
    "category_id" VARCHAR(36) NOT NULL REFERENCES "categories"("id") ON DELETE CASCADE,
    "price" DECIMAL(12, 2) NOT NULL,
    "hpp" DECIMAL(12, 2),
    "description" TEXT,
    "status" "MenuStatus" DEFAULT 'TERSEDIA',
    "image" VARCHAR(255),
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabel Pesanan & Antrean
CREATE TABLE IF NOT EXISTS "orders" (
    "id" VARCHAR(36) PRIMARY KEY,
    "queue_number" VARCHAR(20) NOT NULL,
    "total_amount" DECIMAL(12, 2) NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL,
    "cash_received" DECIMAL(12, 2),
    "change_amount" DECIMAL(12, 2),
    "status" "OrderStatus" DEFAULT 'COMPLETED',
    "order_date" DATE DEFAULT CURRENT_DATE,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabel Item Pesanan
CREATE TABLE IF NOT EXISTS "order_items" (
    "id" VARCHAR(36) PRIMARY KEY,
    "order_id" VARCHAR(36) NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
    "menu_id" VARCHAR(36) NOT NULL REFERENCES "menus"("id"),
    "menu_name" VARCHAR(150) NOT NULL,
    "price" DECIMAL(12, 2) NOT NULL,
    "quantity" INT NOT NULL DEFAULT 1,
    "subtotal" DECIMAL(12, 2) NOT NULL
);

-- 6. Tabel Antrean Harian (Queue)
CREATE TABLE IF NOT EXISTS "queues" (
    "id" VARCHAR(36) PRIMARY KEY,
    "queue_number" INT NOT NULL,
    "formatted" VARCHAR(20) NOT NULL,
    "date" VARCHAR(20) NOT NULL,
    "order_id" VARCHAR(36),
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Tabel Pengeluaran Toko (Expenses)
CREATE TABLE IF NOT EXISTS "expenses" (
    "id" VARCHAR(36) PRIMARY KEY,
    "title" VARCHAR(255) NOT NULL,
    "amount" DECIMAL(12, 2) NOT NULL,
    "category" VARCHAR(100) DEFAULT 'Operasional',
    "notes" TEXT,
    "expense_date" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. FITUR 1: Tabel Pesanan Tersimpan Sementara (Saved / Pending Orders)
CREATE TABLE IF NOT EXISTS "saved_orders" (
    "id" VARCHAR(36) PRIMARY KEY,
    "order_name" VARCHAR(150) NOT NULL,
    "items" JSONB NOT NULL,
    "total_price" DECIMAL(12, 2) NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. FITUR 2: Tabel Penyesuaian Sisa Saldo Riil Kasir & Bank (Balance Adjustments)
CREATE TABLE IF NOT EXISTS "balance_adjustments" (
    "id" VARCHAR(36) PRIMARY KEY,
    "type" "BalanceType" NOT NULL,
    "actual_amount" DECIMAL(12, 2) NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes untuk optimasi query
CREATE INDEX IF NOT EXISTS "idx_orders_order_date" ON "orders"("order_date");
CREATE INDEX IF NOT EXISTS "idx_saved_orders_created_at" ON "saved_orders"("created_at");
CREATE INDEX IF NOT EXISTS "idx_balance_adjustments_type" ON "balance_adjustments"("type");
CREATE INDEX IF NOT EXISTS "idx_balance_adjustments_updated_at" ON "balance_adjustments"("updated_at");
