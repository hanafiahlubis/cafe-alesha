"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "@/app/context/ThemeContext";

const ThemeToggler = () => {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />;
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      aria-label="Ganti mode gelap / terang"
      onClick={toggleTheme}
      className={`flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-300 shadow-sm cursor-pointer active:scale-90 ${
        isDark
          ? "border-slate-700 bg-slate-800 text-amber-400 hover:bg-slate-700 hover:border-slate-600"
          : "border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:border-blue-300"
      }`}
      title={isDark ? "Klik untuk ganti ke Mode Terang (Putih-Biru)" : "Klik untuk ganti ke Mode Gelap"}
    >
      {isDark ? (
        // Sun icon (click to switch to light)
        <svg className="h-5 w-5 transition-transform duration-300 hover:rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        // Moon icon (click to switch to dark)
        <svg className="h-5 w-5 transition-transform duration-300 hover:-rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
};

export default ThemeToggler;
