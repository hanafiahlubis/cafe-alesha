"use client";

import React from "react";
import { Feature } from "@/types/feature";

const SingleFeature = ({ feature }: { feature: Feature }) => {
  const { title, description } = feature;

  return (
    <div className="group relative rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-blue-400/40">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white dark:bg-blue-950/60 dark:text-blue-400 dark:group-hover:bg-blue-600 dark:group-hover:text-white mb-5">
        <svg className="h-6 w-6 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      </div>

      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
        {title}
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
        {description}
      </p>
    </div>
  );
};

export default SingleFeature;
