"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Smartphone } from "lucide-react";

function AppleStoreLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 384 512" className={className} fill="currentColor" aria-hidden="true">
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
  );
}

function GooglePlayLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M47.7 27.5C41.8 33.7 38.3 43.1 38.3 55.4v401.2c0 12.3 3.5 21.7 9.4 27.9l2.2 2 225.1-225.1v-5.4L49.9 25.5l-2.2 2z"
      />
      <path
        fill="#FBBC04"
        d="M349.8 326.1l-74.8-74.8v-5.4l74.8-74.8 1.7 1 88.6 50.3c25.3 14.4 25.3 37.9 0 52.3l-88.6 50.4-1.7 1z"
      />
      <path
        fill="#EA4335"
        d="M275 251.3L47.7 478.6c8.3 8.8 22 9.9 37.4 1.2l266.4-151.4-76.5-77.1z"
      />
      <path
        fill="#34A853"
        d="M275 260.7l76.5-77.1L85.1 32.2c-15.4-8.8-29.1-7.6-37.4 1.2L275 260.7z"
      />
    </svg>
  );
}

interface HostCtaBannerProps {
  t: (en: string, ar: string) => string;
  lang: "ar" | "en";
}

export function HostCtaBanner({ t, lang }: HostCtaBannerProps) {
  return (
    <section className="mx-auto max-w-[1440px] px-5 py-14 sm:px-8 lg:py-20">
      <div className="relative overflow-hidden rounded-3xl border border-purple-900/40 bg-[#1e0e38] dark:bg-[#120824] px-6 py-12 sm:px-14 lg:py-16 text-white shadow-xl transition-colors">
        <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3.5 py-1.5 text-xs font-bold text-[#FF9750]">
              <Smartphone size={14} />
              <span>{t("QafNest Business App", "تطبيق قاف نست للأعمال")}</span>
            </span>
            <h2 className="mt-4 text-2xl sm:text-4xl font-black leading-tight text-white tracking-tight">
              {t(
                "Manage Your Property Anytime, Anywhere",
                "أدر عقارك وحجوزاتك من جوالك بكل سهولة"
              )}
            </h2>
            <p className="mt-3 text-sm sm:text-base font-normal text-purple-200">
              {t(
                "Update your calendar, adjust nightly prices, and track bank remittances on the go.",
                "تحكم بالتقويم والأسعار وتابع الحوالات المالية وإشعارات الحجوزات الفورية."
              )}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={`/${lang}/app`}
                className="inline-flex items-center gap-3 rounded-xl bg-black/80 hover:bg-black px-4 py-2.5 text-left text-white border border-white/20 transition shadow-xs group"
              >
                <AppleStoreLogo className="w-6 h-6 text-white shrink-0 group-hover:scale-105 transition-transform" />
                <div>
                  <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-medium leading-none mb-1">
                    Download on the
                  </span>
                  <span className="text-sm font-bold leading-none tracking-tight">App Store</span>
                </div>
              </Link>
              <Link
                href={`/${lang}/app`}
                className="inline-flex items-center gap-3 rounded-xl bg-black/80 hover:bg-black px-4 py-2.5 text-left text-white border border-white/20 transition shadow-xs group"
              >
                <GooglePlayLogo className="w-5 h-5 shrink-0 group-hover:scale-105 transition-transform" />
                <div>
                  <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-medium leading-none mb-1">
                    GET IT ON
                  </span>
                  <span className="text-sm font-bold leading-none tracking-tight">Google Play</span>
                </div>
              </Link>
              <Link
                href={`/${lang}/app`}
                className="inline-flex items-center gap-2 rounded-xl bg-[#4F2396] hover:bg-[#3D1A78] px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm transition"
              >
                <span>{t("Open Web Dashboard", "الدخول للوحة التحكم")}</span>
                {lang === "ar" ? <ArrowLeft size={15} /> : <ArrowRight size={15} />}
              </Link>
            </div>
          </div>

          <div className="mx-auto w-full max-w-[340px] rounded-2xl border border-white/15 bg-white/10 dark:bg-white/5 p-4 sm:p-5 backdrop-blur-md">
            <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#12101a] p-4 text-slate-900 dark:text-white shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="text-xs font-bold text-[#4F2396] dark:text-purple-300">QafNest Business</span>
                <span className="rounded-md bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                  {t("Transferred", "تم التحويل")}
                </span>
              </div>
              <p className="mt-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                {t("Latest Bank Remittance", "آخر حوالة بنكية")}
              </p>
              <p className="text-2xl font-black text-[#4F2396] dark:text-purple-300">12,600 SAR</p>
              <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 p-2.5 text-center text-xs">
                <div>
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400">
                    {t("Occupancy", "نسبة الإشغال")}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">88%</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400">
                    {t("Host Score", "نقاط الأداء")}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">9.6 / 10</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
