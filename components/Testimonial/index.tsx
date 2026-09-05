"use client";

import React from "react";
import SectionHeader from "@/components/Common/SectionHeader";
import testimonialData from "./testimonialData";
import SingleTestimonial from "./SingleTestimonial";

const Testimonial = () => {
  return (
    <section id="testimonials" className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          headerInfo={{
            title: "TESTIMONI",
            subtitle: "Apa Kata Mereka Tentang Proyek Ini",
            description: "Umpan balik dari kreator dan tim pengembang yang menggunakan template Next.js edisi biru.",
          }}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {testimonialData.map((review) => (
            <SingleTestimonial key={review.id} review={review} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonial;
