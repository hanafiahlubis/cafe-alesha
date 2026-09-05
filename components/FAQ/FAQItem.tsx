"use client";

import React, { useState } from "react";
import { FAQ } from "@/types/faq";

const FAQItem = ({ faqData }: { faqData: FAQ }) => {
  const [active, setActive] = useState(false);
  const { quest, ans } = faqData;

  return (
    <div className="border-b border-slate-200 dark:border-slate-800 py-5">
      <button
        onClick={() => setActive(!active)}
        className="flex w-full items-center justify-between text-left text-base font-semibold text-slate-900 dark:text-white transition hover:text-blue-600 dark:hover:text-blue-400"
      >
        <span>{quest}</span>
        <span className={`ml-4 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 transition-transform ${active ? "rotate-180 bg-blue-50 dark:bg-slate-800 text-blue-600" : ""}`}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {active && (
        <div className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed pr-8">
          {ans}
        </div>
      )}
    </div>
  );
};

export default FAQItem;
