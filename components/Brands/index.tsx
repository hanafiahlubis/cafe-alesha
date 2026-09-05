"use client";

import React from "react";
import brandData from "./brandData";

const Brands = () => {
  return (
    <section className="border-y border-slate-200 bg-slate-50/50 py-10 dark:border-slate-800 dark:bg-slate-950/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center text-xs font-semibold uppercase tracking-wider text-slate-400 mb-6">
          Didukung oleh Teknologi Modern
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 items-center justify-center">
          {brandData.map((brand) => (
            <div
              key={brand.id}
              className="flex items-center justify-center gap-2 text-slate-500 transition hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 font-semibold text-sm"
            >
              <div className="h-6 w-6 rounded bg-blue-600/20 text-blue-600 flex items-center justify-center text-xs font-bold">
                {brand.name.substring(0, 1)}
              </div>
              <span>{brand.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Brands;
