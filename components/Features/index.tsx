"use client";

import React from "react";
import SectionHeader from "@/components/Common/SectionHeader";
import featuresData from "./featuresData";
import SingleFeature from "./SingleFeature";

const Features = () => {
  return (
    <section id="features" className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          headerInfo={{
            title: "FITUR UNGGULAN",
            subtitle: "Dirancang untuk Mempercepat Eksekusi Proyek Anda",
            description: "Setiap fitur dan komponen disiapkan agar Anda bisa langsung fokus ke logika bisnis dan produk Anda tanpa repot mendesain ulang.",
          }}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuresData.map((feature) => (
            <SingleFeature key={feature.id} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
