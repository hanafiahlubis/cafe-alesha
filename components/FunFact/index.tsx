"use client";

import React from "react";

const FunFact = () => {
  return (
    <section className="py-12 bg-blue-600 text-white text-center">
      <div className="mx-auto max-w-7xl px-4 grid grid-cols-2 sm:grid-cols-4 gap-6">
        <div>
          <div className="text-3xl font-black">100%</div>
          <div className="text-xs text-blue-100">Next.js 15 Ready</div>
        </div>
        <div>
          <div className="text-3xl font-black">NeonDB</div>
          <div className="text-xs text-blue-100">PostgreSQL Cloud</div>
        </div>
        <div>
          <div className="text-3xl font-black">QRIS</div>
          <div className="text-xs text-blue-100">Upload Kustom</div>
        </div>
        <div>
          <div className="text-3xl font-black">58/80mm</div>
          <div className="text-xs text-blue-100">Thermal Receipt</div>
        </div>
      </div>
    </section>
  );
};

export default FunFact;
