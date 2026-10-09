"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import menuData from "./menuData";
import ThemeToggler from "./ThemeToggler";

const Header = () => {
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [stickyMenu, setStickyMenu] = useState(false);
  const pathUrl = usePathname();

  useEffect(() => {
    const handleStickyMenu = () => {
      if (window.scrollY >= 20) {
        setStickyMenu(true);
      } else {
        setStickyMenu(false);
      }
    };
    window.addEventListener("scroll", handleStickyMenu);
    return () => window.removeEventListener("scroll", handleStickyMenu);
  }, []);

  return (
    <header
      className={`fixed left-0 top-0 z-40 w-full transition duration-300 border-b sticky ${stickyMenu
        ? "bg-white/95 py-1.5 sm:py-2.5 shadow-sm backdrop-blur-md border-blue-100/80 dark:bg-slate-950/95 dark:border-slate-800"
        : "bg-white/90 py-1.5 sm:py-3 backdrop-blur-md border-blue-100/60 dark:bg-slate-950/85 dark:border-slate-800/80"
        }`}
    >
      <div className="mx-auto max-w-7xl px-2.5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-2">
          {/* Logo Responsif: Kompak di Mobile (320px) & Tablet */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="relative h-8 w-8 sm:h-9 sm:w-9 overflow-hidden rounded-xl shadow-sm border border-blue-200/80 dark:border-slate-700 bg-white">
              <Image
                src="/images/logo/alesha-white.jpeg"
                alt="Logo Kasir POS"
                fill
                sizes="(max-width: 640px) 32px, 36px"
                className="dark:hidden object-cover"
                priority
              />
              <Image
                src="/images/logo/alesha-dark.jpeg"
                alt="Logo Kasir POS Dark"
                fill
                sizes="(max-width: 640px) 32px, 36px"
                className="hidden dark:block object-cover"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white tracking-tight leading-none">
                ALESHA POS
              </span>
              <span className="text-[9px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider leading-none mt-0.5">
                Cafe &amp; Resto
              </span>
            </div>
          </Link>

          {/* Navigasi Desktop & Tablet Landscape */}
          <nav className="hidden md:flex items-center gap-2 lg:gap-4 xl:gap-6">
            {menuData.map((menuItem) => {
              const isActive =
                menuItem.path === "/"
                  ? pathUrl === "/" || pathUrl === "/kasir"
                  : pathUrl === menuItem.path;
              return (
                <Link
                  key={menuItem.id}
                  href={menuItem.path || "#"}
                  className={`text-xs xl:text-sm font-semibold transition duration-200 px-3 py-1.5 rounded-xl ${isActive
                    ? "text-blue-700 bg-blue-50 border border-blue-200/80 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-900 font-bold"
                    : "text-slate-700 hover:text-blue-600 hover:bg-blue-50/50 dark:text-slate-300 dark:hover:text-blue-400 dark:hover:bg-slate-800/50"
                    }`}
                >
                  {menuItem.title}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <ThemeToggler />
            <button
              aria-label="Menu navigasi ponsel"
              onClick={() => setNavigationOpen(!navigationOpen)}
              className="md:hidden flex h-8 w-8 items-center justify-center rounded-xl border border-blue-200/80 bg-blue-50/60 text-blue-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 cursor-pointer active:scale-95"
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                {navigationOpen ? (
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                ) : (
                  <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Dropdown Mobile Nav */}
        {navigationOpen && (
          <div className="md:hidden mt-2 rounded-2xl border border-blue-100 bg-white p-2.5 shadow-xl dark:border-slate-800 dark:bg-slate-900 animate-fadeIn">
            <nav className="flex flex-col gap-1">
              {menuData.map((menuItem) => {
                const isActive =
                  menuItem.path === "/"
                    ? pathUrl === "/" || pathUrl === "/kasir"
                    : pathUrl === menuItem.path;
                return (
                  <Link
                    key={menuItem.id}
                    href={menuItem.path || "#"}
                    onClick={() => setNavigationOpen(false)}
                    className={`rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold transition ${isActive
                      ? "bg-blue-50 text-blue-700 border border-blue-200/80 dark:bg-blue-950/70 dark:text-blue-400 font-bold"
                      : "text-slate-700 hover:bg-blue-50/40 dark:text-slate-300 dark:hover:bg-slate-800"
                      }`}
                  >
                    {menuItem.title}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
