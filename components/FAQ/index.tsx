"use client";

import React from "react";
import SectionHeader from "@/components/Common/SectionHeader";
import faqData from "./faqData";
import FAQItem from "./FAQItem";

const FAQ = () => {
  return (
    <section id="faq" className="py-20 lg:py-28 bg-slate-50/60 dark:bg-slate-950/40">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          headerInfo={{
            title: "PERTANYAAN UMUM",
            subtitle: "Pertanyaan yang Sering Diajukan",
            description: "Informasi penting seputar cara penggunaan template, pengaturan database .env, dan penyesuaian tema.",
          }}
        />

        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {faqData.map((item) => (
            <FAQItem key={item.id} faqData={item} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
