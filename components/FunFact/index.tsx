"use client";

import React from "react";

const FunFact = () => {
  return (
    <section className="bg-gradient-blue-bg py-16 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          <div>
            <h3 className="text-4xl font-extrabold">99.9%</h3>
            <p className="mt-2 text-sm text-blue-100">Uptime & Performa Tinggi</p>
          </div>
          <div>
            <h3 className="text-4xl font-extrabold">&lt;100ms</h3>
            <p className="mt-2 text-sm text-blue-100">Waktu Muat Rata-rata</p>
          </div>
          <div>
            <h3 className="text-4xl font-extrabold">100%</h3>
            <p className="mt-2 text-sm text-blue-100">Responsif & Mobile Friendly</p>
          </div>
          <div>
            <h3 className="text-4xl font-extrabold">PostgreSQL</h3>
            <p className="mt-2 text-sm text-blue-100">Database Ready via .env</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FunFact;
