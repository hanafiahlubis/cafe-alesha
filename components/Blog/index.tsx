"use client";

import React from "react";
import SectionHeader from "@/components/Common/SectionHeader";
import blogData from "./blogData";
import BlogItem from "./BlogItem";

const Blog = () => {
  return (
    <section className="py-20 lg:py-28 bg-slate-50/50 dark:bg-slate-950/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          headerInfo={{
            title: "BERITA & ARTIKEL",
            subtitle: "Wawasan Pengembangan & Desain",
            description: "Pelajari artikel terbaru mengenai integrasi Next.js, database modern, dan tren desain aplikasi.",
          }}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {blogData.map((item) => (
            <BlogItem key={item._id} blog={item} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Blog;
