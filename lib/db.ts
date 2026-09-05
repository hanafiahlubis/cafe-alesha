// Helper koneksi database (Prisma / Client DB)
// Anda dapat mengaktifkan Prisma Client setelah menginstal @prisma/client

export const getDatabaseConfig = () => {
  return {
    url: process.env.DATABASE_URL,
    storeName: process.env.NEXT_PUBLIC_STORE_NAME || "CAFE & RESTO BIRU",
    storeAddress: process.env.NEXT_PUBLIC_STORE_ADDRESS || "Jl. Melati No. 12, Jakarta",
    storePhone: process.env.NEXT_PUBLIC_STORE_PHONE || "0812-3456-7890",
    qrisMerchant: process.env.NEXT_PUBLIC_QRIS_MERCHANT_NAME || "KASIR CAFE & RESTO BIRU",
    qrisNmid: process.env.NEXT_PUBLIC_QRIS_NMID || "ID1020030040050",
  };
};
