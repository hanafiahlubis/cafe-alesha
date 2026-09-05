"use client";

import React from "react";
import Link from "next/link";
import { Blog } from "@/types/blog";

const BlogItem = ({ blog }: { blog: Blog }) => {
  const { title, metadata, publishedAt, tags, slug } = blog;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap gap-2 mb-3">
        {tags?.map((tag, i) => (
          <span key={i} className="rounded-md bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
            {tag}
          </span>
        ))}
      </div>

      <h3 className="text-lg font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition mb-2">
        <Link href={`/blog/${slug}`}>{title}</Link>
      </h3>

      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
        {metadata}
      </p>

      <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
        <span>{publishedAt}</span>
        <Link href={`/blog/${slug}`} className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
          Baca Selengkapnya →
        </Link>
      </div>
    </div>
  );
};

export default BlogItem;
