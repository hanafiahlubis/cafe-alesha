"use client";

import React from "react";
import SectionHeader from "@/components/Common/SectionHeader";
import testimonialData from "./testimonialData";
import SingleTestimonial from "./SingleTestimonial";

const Testimonial = () => {
  return (
    <section id="testimonials" className="py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          headerInfo={{
            title: "TESTIMONI",
            subtitle: "Apa Kata Tim Pengembang",
            description: "Umpan balik dari pengguna sistem POS Kasir.",
          }}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {testimonialData.map((review) => (
            <SingleTestimonial key={review.id} review={review} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonial;
