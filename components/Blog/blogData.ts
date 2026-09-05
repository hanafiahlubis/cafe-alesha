import { Blog } from "@/types/blog";

const blogData: Blog[] = [
  {
    _id: 1,
    title: "Memulai Proyek Next.js 15 dengan Database PostgreSQL Neon.tech",
    slug: "memulai-nextjs-neon-postgresql",
    metadata: "Panduan praktis menghubungkan database serverless PostgreSQL ke Next.js App Router.",
    publishedAt: "05 Sep 2026",
    tags: ["Next.js", "Database", "Neon.tech"],
    author: {
      name: "Tim Pengembang",
      image: "/images/user/user-01.png",
    },
  },
  {
    _id: 2,
    title: "Mengapa Warna Biru Menjadi Standar Terbaik Antarmuka SaaS Modern",
    slug: "psikologi-warna-biru-saas",
    metadata: "Membangun kepercayaan dan rasa aman pengguna melalui penerapan palet biru yang harmonis.",
    publishedAt: "05 Sep 2026",
    tags: ["UI/UX", "Branding", "Design"],
    author: {
      name: "Diga Abria N.",
      image: "/images/user/user-02.png",
    },
  },
];

export default blogData;
