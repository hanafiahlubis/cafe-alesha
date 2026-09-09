"use client";

import React from "react";
import { Feature } from "@/types/feature";

const SingleFeature = ({ feature }: { feature: Feature }) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">{feature.title}</h3>
      <p className="text-xs text-slate-500">{feature.description}</p>
    </div>
  );
};

export default SingleFeature;
