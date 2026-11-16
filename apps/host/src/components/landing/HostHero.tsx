"use client";

import React from "react";
import type { User } from "@supabase/supabase-js";
import { Plus, ShieldCheck, Sparkles, TrendingUp, Wallet } from "lucide-react";

interface HostHeroProps {
  t: (en: string, ar: string) => string;
  user: User | null;
  router: { push: (url: string) => void };
  openHostAuthModal: (mode: "signin" | "signup", returnUrl?: string) => void;
}

export function HostHero({ t, user, router, openHostAuthModal }: HostHeroProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-violet-100/40 via-violet-50/20 to-white pt-32 pb-16 sm:pt-36 sm:pb-20">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8">
        <div className="mx-auto max-w-4xl text-center">
          {/* Ministry License Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white px-4 py-1.5 text-xs font-extrabold text-[#4F2396] shadow-xs">
            <Sparkles size={14} className="text-[#FF9750]" />
            <span>
              {t(
                "Licensed & Approved by the Saudi Ministry of Tourism",
                "المنصة مرخصة ومعتمدة رسمياً من وزارة السياحة السعودية"
              )}
            </span>
          </div>

          {/* Impactful Business Value Proposition Headline */}
          <h1 className="mt-6 text-3xl sm:text-5xl lg:text-[54px] font-black leading-[1.24] tracking-tight text-[#010112]">
            {t(
              "Comprehensive Coverage for Property Damage and Incidents in General Terms",
              "تغطية شاملة لأضرار العقار والحوادث بشروط عامة"
            )}
          </h1>

          {/* Clear Subtitle */}
          <p className="mx-auto mt-5 max-w-2xl text-base sm:text-xl font-medium leading-relaxed text-slate-600">
            {t(
              "List your chalet, villa, apartment, or camp for free and welcome thousands of verified guests with guaranteed payouts and complete peace of mind.",
              "سجل شاليهك، فيلتك، شقتك، أو مخيمك مجاناً واستقبل آلاف الضيوف الموثقين بحجوزات مضمونة وأرباح محولة لحسابك البنكي بكل أمان وسهولة."
            )}
          </p>

          {/* Exactly 2 Clean CTAs */}
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => {
                const activeLang = t("en", "ar");
                const targetUrl = `/${activeLang}/properties/new?mode=new`;
                if (user) {
                  router.push(targetUrl);
                } else {
                  openHostAuthModal("signup", targetUrl);
                }
              }}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#FF9750] hover:bg-[#f58438] px-10 py-4 text-base font-black text-[#2d1259] shadow-xl shadow-amber-500/20 transition active:scale-[0.98] cursor-pointer"
            >
              <Plus size={18} />
              <span>{t("Register Your Property Free", "سجل عقارك مجاناً")}</span>
            </button>

            <a
              href="#calculator"
              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-violet-300 bg-white hover:border-[#4F2396] hover:bg-violet-50/50 px-9 py-3.5 text-base font-extrabold text-[#4F2396] shadow-xs transition"
            >
              <span>{t("Calculate Expected Earnings ↓", "احسب أرباحك المتوقعة ↓")}</span>
            </a>
          </div>

          {/* 3 Core Trust Badges */}
          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3 text-start">
            <div className="rounded-2xl border border-violet-200/80 bg-white p-5 shadow-xs">
              <div className="flex items-center gap-2.5 text-sm font-black text-[#4F2396]">
                <Wallet size={18} className="text-[#FF9750]" />
                <span>{t("48-Hour Direct Payout", "إيداع بنكي خلال 48 ساعة")}</span>
              </div>
              <p className="mt-1.5 text-xs font-semibold leading-5 text-slate-500">
                {t(
                  "Automatic bank transfer directly to your IBAN after guest check-in.",
                  "تحويل أرباحك تلقائياً إلى حسابك البنكي خلال 48 ساعة من تسجيل دخول الضيف."
                )}
              </p>
            </div>

            <div className="rounded-2xl border border-violet-200/80 bg-white p-5 shadow-xs">
              <div className="flex items-center gap-2.5 text-sm font-black text-[#4F2396]">
                <ShieldCheck size={18} className="text-[#FF9750]" />
                <span>{t("Comprehensive Host Protection", "حماية شاملة للمضيف")}</span>
              </div>
              <p className="mt-1.5 text-xs font-semibold leading-5 text-slate-500">
                {t(
                  "Comprehensive coverage for property damage and incidents under general protection terms.",
                  "تغطية تأمينية شاملة لحماية أثاث ومحتويات وحدتك ضد التلف أو الحوادث بشروط عامة."
                )}
              </p>
            </div>

            <div className="rounded-2xl border border-violet-200/80 bg-white p-5 shadow-xs">
              <div className="flex items-center gap-2.5 text-sm font-black text-[#4F2396]">
                <TrendingUp size={18} className="text-[#FF9750]" />
                <span>{t("100% Free Listing", "تسجيل مجاني 100%")}</span>
              </div>
              <p className="mt-1.5 text-xs font-semibold leading-5 text-slate-500">
                {t(
                  "Zero setup fees, complete flexibility to set your prices and calendar.",
                  "بدون أي رسوم تأسيس أو اشتراكات، تحكم كامل بأسعار عطلات الأسبوع والمواسم."
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
