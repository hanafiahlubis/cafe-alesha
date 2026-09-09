"use client";

import React from "react";
import Image from "next/image";
import { Testimonial } from "@/types/testimonial";

const SingleTestimonial = ({ review }: { review: Testimonial }) => {
  const { name, designation, content, image } = review;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 italic mb-4">
        &ldquo;{content}&rdquo;
      </p>
      <div className="flex items-center gap-3 border-t border-slate-100 dark:border-slate-800 pt-3">
        <Image
          src={image}
          alt={name}
          width={40}
          height={40}
          className="rounded-full bg-blue-100 object-cover"
        />
        <div>
          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">{name}</h4>
          <p className="text-[10px] text-slate-500">{designation}</p>
        </div>
      </div>
    </div>
  );
};

export default SingleTestimonial;
