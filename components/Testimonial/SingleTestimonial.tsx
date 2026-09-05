"use client";

import React from "react";
import Image from "next/image";
import { Testimonial } from "@/types/testimonial";

const SingleTestimonial = ({ review }: { review: Testimonial }) => {
  const { name, designation, content, image } = review;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-1 text-amber-400 mb-4">
        {"★".repeat(5)}
      </div>

      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic mb-6">
        &ldquo;{content}&rdquo;
      </p>

      <div className="flex items-center gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
        <Image
          src={image}
          alt={name}
          width={44}
          height={44}
          className="rounded-full bg-blue-100 object-cover"
        />
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">{name}</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">{designation}</p>
        </div>
      </div>
    </div>
  );
};

export default SingleTestimonial;
