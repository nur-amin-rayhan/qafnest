"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Smartphone } from "lucide-react";

interface HostCtaBannerProps {
  t: (en: string, ar: string) => string;
  lang: "ar" | "en";
}

export function HostCtaBanner({ t, lang }: HostCtaBannerProps) {
  return (
    <section className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 lg:py-24">
      <div className="relative overflow-hidden rounded-[36px] bg-gradient-to-r from-[#2e1065] via-[#4F2396] to-[#6d28d9] px-6 py-12 sm:px-14 lg:py-16 text-white shadow-xl">
        <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-extrabold text-[#FF9750]">
              <Smartphone size={15} />
              <span>{t("QafNest Business App", "تطبيق قاف نست للأعمال")}</span>
            </span>
            <h2 className="mt-4 text-2xl sm:text-4xl font-black leading-tight">
              {t(
                "Manage Your Property Anytime, Anywhere",
                "أدر عقارك وحجوزاتك من جوالك بكل سهولة"
              )}
            </h2>
            <p className="mt-3 text-base sm:text-xl font-medium text-[#FF9750]">
              {t(
                "Update your calendar, adjust nightly prices, and track bank remittances on the go.",
                "تحكم بالتقويم والأسعار وتابع الحوالات المالية وإشعارات الحجوزات الفورية."
              )}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={`/${lang}/app`}
                className="inline-flex items-center gap-3 rounded-2xl bg-black/80 hover:bg-black px-5 py-3.5 text-left text-white border border-white/15 transition"
              >
                <Smartphone size={22} className="text-[#FF9750]" />
                <div>
                  <span className="block text-[10px] uppercase tracking-wider text-slate-300">
                    Download on the
                  </span>
                  <span className="text-sm font-black">App Store</span>
                </div>
              </Link>
              <Link
                href={`/${lang}/app`}
                className="inline-flex items-center gap-3 rounded-2xl bg-black/80 hover:bg-black px-5 py-3.5 text-left text-white border border-white/15 transition"
              >
                <Smartphone size={22} className="text-emerald-400" />
                <div>
                  <span className="block text-[10px] uppercase tracking-wider text-slate-300">
                    GET IT ON
                  </span>
                  <span className="text-sm font-black">Google Play</span>
                </div>
              </Link>
              <Link
                href={`/${lang}/app`}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#FF9750] px-6 py-3.5 text-sm font-black text-[#2d1259] hover:bg-white transition"
              >
                <span>{t("Open Web Dashboard Now", "الدخول للوحة التحكم الآن")}</span>
                {lang === "ar" ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
              </Link>
            </div>
          </div>

          <div className="mx-auto w-full max-w-[340px] rounded-3xl border border-white/20 bg-white/10 p-5 backdrop-blur-md">
            <div className="rounded-2xl bg-white p-4 text-slate-900 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-black text-[#4F2396]">QafNest Business</span>
                <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800">
                  {t("Transferred", "تم التحويل")}
                </span>
              </div>
              <p className="mt-3 text-xs font-bold text-slate-400">
                {t("Latest Bank Remittance", "آخر حوالة بنكية")}
              </p>
              <p className="text-2xl font-black text-[#4F2396]">12,600 SAR</p>
              <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-violet-50 p-2.5 text-center text-xs">
                <div>
                  <span className="block text-[10px] text-slate-500">
                    {t("Occupancy", "نسبة الإشغال")}
                  </span>
                  <span className="font-black text-violet-950">88%</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500">
                    {t("Host Score", "نقاط الأداء")}
                  </span>
                  <span className="font-black text-violet-950">9.6 / 10</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
