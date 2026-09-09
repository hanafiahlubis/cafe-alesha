"use client";

import React, { useState } from "react";
import { FAQ } from "@/types/faq";

const FAQItem = ({ faqData }: { faqData: FAQ }) => {
  const [active, setActive] = useState(false);
  const { quest, ans } = faqData;

  return (
    <div className="border-b border-slate-200 dark:border-slate-800 py-4">
      <button
        onClick={() => setActive(!active)}
        className="flex w-full items-center justify-between text-left text-sm font-semibold text-slate-900 dark:text-white transition hover:text-blue-600 cursor-pointer"
      >
        <span>{quest}</span>
        <span className={`ml-4 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 transition-transform ${active ? "rotate-180 bg-blue-50 dark:bg-slate-800 text-blue-600" : ""}`}>
          ▼
        </span>
      </button>
      {active && (
        <div className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          {ans}
        </div>
      )}
    </div>
  );
};

export default FAQItem;
