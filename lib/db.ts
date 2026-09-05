// Helper koneksi database (Prisma / Client DB)
// Anda dapat mengaktifkan Prisma Client setelah menginstal @prisma/client

export const getDatabaseConfig = () => {
  return {
    url: process.env.DATABASE_URL
  };
};
