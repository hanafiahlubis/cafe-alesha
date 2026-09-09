"use client";

import React from "react";
import featuresData from "./featuresData";
import SingleFeature from "./SingleFeature";

const Features = () => {
  return (
    <section id="features" className="py-16">
      <div className="mx-auto max-w-7xl px-4 grid grid-cols-1 sm:grid-cols-3 gap-6">
        {featuresData.map((f) => (
          <SingleFeature key={f.id} feature={f} />
        ))}
      </div>
    </section>
  );
};

export default Features;
