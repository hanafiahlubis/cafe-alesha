import { FeatureTab } from "@/types/featureTab";

const featuresTabData: FeatureTab[] = [
  {
    id: "tabOne",
    title: "Desain Modern & Responsif",
    desc1: "Tampilan antarmuka profesional yang dirancang khusus untuk startup, SaaS, dan aplikasi web modern dengan nuansa biru khas.",
    desc2: "Mendukung tampilan sempurna di smartphone, tablet, laptop, hingga monitor resolusi ultra-wide.",
    image: "/images/shape/shape-02.svg",
    imageDark: "/images/shape/shape-02.svg",
  },
  {
    id: "tabTwo",
    title: "Database Terintegrasi via .env",
    desc1: "Tidak perlu pusing konfigurasi awal database. Connection string PostgreSQL / Neon.tech sudah dipetakan di file environment.",
    desc2: "Anda bisa langsung menghubungkan schema tabel, user management, dan migrasi kapan saja saat model data siap dibahas.",
    image: "/images/shape/shape-03.svg",
    imageDark: "/images/shape/shape-03.svg",
  },
  {
    id: "tabThree",
    title: "Kode Bersih & Mudah Dikustomisasi",
    desc1: "Setiap komponen dibuat modular dengan TypeScript untuk memudahkan skalabilitas dan pemeliharaan tim pengembang.",
    desc2: "Dapat diekspor ke Vercel, Netlify, atau server mandiri dengan satu perintah build.",
    image: "/images/shape/shape-02.svg",
    imageDark: "/images/shape/shape-02.svg",
  },
];

export default featuresTabData;
