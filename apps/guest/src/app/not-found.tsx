"use client";

import Link from "next/link";
import { Compass, ArrowRight, Home } from "lucide-react";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import { useApp } from "@/context/AppContext";

export default function NotFound() {
  const { language } = useApp();

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-[#06060B] dark:text-gray-100 flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-24 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400 border border-violet-200 dark:border-violet-500/20 shadow-xl shadow-violet-900/10">
            <Compass className="h-10 w-10 animate-pulse" />
          </div>

          <span className="mt-6 inline-block text-xs font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400">
            404 · {language === "ar" ? "الصفحة غير موجودة" : "Page Not Found"}
          </span>

          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl text-gray-950 dark:text-white">
            {language === "ar" ? "وجهتك غير واضحة" : "Lost in the Dunes?"}
          </h1>

          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            {language === "ar"
              ? "يبدو أن الصفحة أو العقار الذي تبحث عنه غير متاح أو تم نقله. يمكنك العودة واستكشاف أرقى الشاليهات والفلل في المملكة."
              : "The stay, page, or destination you were looking for doesn't exist or has been relocated. Explore our verified luxury chalets across Saudi Arabia."}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-violet-700 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-900/20 hover:bg-violet-800 transition active:scale-95"
            >
              <Home className="h-4 w-4" />
              <span>{language === "ar" ? "الرئيسية" : "Back to Home"}</span>
            </Link>

            <Link
              href="/search"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3.5 text-sm font-bold text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-200 transition active:scale-95"
            >
              <span>{language === "ar" ? "استكشف العقارات" : "Explore Stays"}</span>
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
