import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/Common/ScrollToTop";
import { ThemeProvider } from "@/app/context/ThemeContext";
import { ToastContext } from "@/app/context/ToastContext";
import { POSProvider } from "@/context/POSContext";

export const metadata: Metadata = {
  title: "Aplikasi POS Kasir Modern - Tema Biru Muda & Putih",
  description: "Aplikasi kasir (POS) Next.js dengan antrean otomatis, pembayaran Cash & QRIS BCA, upload QRIS, pop-up struk, dan rekap penjualan.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="light" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function() {
              try {
                var theme = localStorage.getItem('pos_theme') || 'light';
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                  document.documentElement.classList.remove('light');
                  document.documentElement.setAttribute('data-theme', 'dark');
                } else {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.classList.add('light');
                  document.documentElement.setAttribute('data-theme', 'light');
                }
              } catch (e) {}
               
            })();`,
          }}
        />
      </head>
      <body className="flex min-h-screen flex-col bg-[#F0F7FF] text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-50 antialiased">
        <ThemeProvider>
          <POSProvider>
            <ToastContext />
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <ScrollToTop />
          </POSProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
