"use client";

import React, { useState } from "react";
import SectionHeader from "@/components/Common/SectionHeader";
import featuresTabData from "./featuresTabData";

const FeaturesTab = () => {
  const [currentTab, setCurrentTab] = useState("tabOne");

  return (
    <section className="bg-slate-50 py-20 dark:bg-slate-950/40 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          headerInfo={{
            title: "EKSPLORASI TABS",
            subtitle: "Fleksibilitas Penuh dalam Satu Aplikasi",
            description: "Ganti tab di bawah ini untuk melihat keunggulan integrasi dan alur kerja template.",
          }}
        />

        {/* Tab Selection Buttons */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {featuresTabData.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                currentTab === tab.id
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "bg-white text-slate-700 hover:bg-blue-50 hover:text-blue-600 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              {tab.title}
            </button>
          ))}
        </div>

        {/* Tab Active Content */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          {featuresTabData.map(
            (tab) =>
              currentTab === tab.id && (
                <div key={tab.id} className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                      {tab.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed mb-4">
                      {tab.desc1}
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">
                      {tab.desc2}
                    </p>
                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400">
                      <span>Koneksi Database Terkonfigurasi di .env</span>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>

                  <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-6 dark:border-blue-950 dark:bg-blue-950/20 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white font-extrabold text-2xl mx-auto mb-4">
                      ✓
                    </div>
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white">Siap Digunakan Langsung</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                      Jalankan <code>npm run dev</code> untuk memulai server lokal pada localhost:3000
                    </p>
                  </div>
                </div>
              )
          )}
        </div>
      </div>
    </section>
  );
};

export default FeaturesTab;
