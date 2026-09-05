"use client";

import React from "react";

type SectionHeaderProps = {
  headerInfo: {
    title: string;
    subtitle: string;
    description: string;
  };
};

const SectionHeader = ({ headerInfo }: SectionHeaderProps) => {
  const { title, subtitle, description } = headerInfo;

  return (
    <div className="mx-auto text-center md:w-4/5 lg:w-3/5 xl:w-1/2 mb-12">
      <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-4">
        {title}
      </div>
      <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl md:text-[40px] md:leading-[1.2] mb-4">
        {subtitle}
      </h2>
      <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">
        {description}
      </p>
    </div>
  );
};

export default SectionHeader;
