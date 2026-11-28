"use client";

import React from "react";
import type { User } from "@supabase/supabase-js";
import { Plus, ShieldCheck, TrendingUp, Wallet } from "lucide-react";

interface HostHeroProps {
  t: (en: string, ar: string) => string;
  user: User | null;
  router: { push: (url: string) => void };
  openHostAuthModal: (mode: "signin" | "signup", returnUrl?: string) => void;
}

export function HostHero({ t, user, router, openHostAuthModal }: HostHeroProps) {
  return (
    <section className="relative overflow-hidden bg-white dark:bg-[#0b0c16] pt-28 pb-14 sm:pt-36 sm:pb-20 border-b border-slate-100 dark:border-slate-800/80 transition-colors">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8">
        <div className="mx-auto max-w-4xl text-center">
          {/* Ministry License Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-200/80 dark:border-purple-900/50 bg-purple-50/70 dark:bg-purple-950/40 px-4 py-1.5 text-xs font-bold text-[#4F2396] dark:text-purple-300">
            <ShieldCheck size={14} className="text-[#FF9750]" />
            <span>
              {t(
                "Licensed & Approved by the Saudi Ministry of Tourism",
                "المنصة مرخصة ومعتمدة رسمياً من وزارة السياحة السعودية"
              )}
            </span>
          </div>

          {/* Humanized Business Value Proposition Headline */}
          <h1 className="mt-6 text-3xl sm:text-5xl lg:text-[52px] font-black leading-[1.2] tracking-tight text-slate-900 dark:text-white">
            {t(
              "Host with Confidence, Maximize Your Property Earnings",
              "استضف بثقة، واستقبل آلاف الضيوف في وحدتك العقارية"
            )}
          </h1>

          {/* Clear Subtitle */}
          <p className="mx-auto mt-4 max-w-2xl text-base sm:text-lg font-normal leading-relaxed text-slate-600 dark:text-slate-400">
            {t(
              "List your chalet, villa, or apartment for free. Welcome verified guests with guaranteed 48-hour payouts and complete host protection.",
              "سجل شاليهك، فيلتك، شقتك، أو مخيمك مجاناً واستقبل ضيوفاً موثقين بحجوزات مضمونة وأرباح محولة لحسابك البنكي بكل أمان وسهولة."
            )}
          </p>

          {/* Exactly 2 Clean CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
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
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#4F2396] hover:bg-[#3D1A78] px-8 py-3.5 text-sm sm:text-base font-bold text-white shadow-sm shadow-[#4F2396]/20 transition active:scale-[0.98] cursor-pointer"
            >
              <Plus size={18} className="stroke-[2.5]" />
              <span>{t("Register Your Property Free", "سجل عقارك مجاناً")}</span>
            </button>

            <a
              href="#calculator"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#12101a] hover:bg-slate-50 dark:hover:bg-slate-900 px-7 py-3.5 text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200 transition"
            >
              <span>{t("Calculate Expected Earnings ↓", "احسب أرباحك المتوقعة ↓")}</span>
            </a>
          </div>

          {/* 3 Core Trust Badges */}
          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3 text-start">
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#12101a] p-5 shadow-xs">
              <div className="flex items-center gap-2.5 text-sm font-bold text-slate-900 dark:text-white">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-purple-50 dark:bg-purple-950/60 text-[#4F2396] dark:text-purple-300">
                  <Wallet size={16} />
                </div>
                <span>{t("48-Hour Direct Payout", "إيداع بنكي خلال 48 ساعة")}</span>
              </div>
              <p className="mt-2 text-xs font-normal leading-5 text-slate-500 dark:text-slate-400">
                {t(
                  "Automatic bank transfer directly to your IBAN after guest check-in.",
                  "تحويل أرباحك تلقائياً إلى حسابك البنكي خلال 48 ساعة من تسجيل دخول الضيف."
                )}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#12101a] p-5 shadow-xs">
              <div className="flex items-center gap-2.5 text-sm font-bold text-slate-900 dark:text-white">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck size={16} />
                </div>
                <span>{t("Comprehensive Host Protection", "حماية شاملة للمضيف")}</span>
              </div>
              <p className="mt-2 text-xs font-normal leading-5 text-slate-500 dark:text-slate-400">
                {t(
                  "Comprehensive coverage for property damage and incidents under general protection terms.",
                  "تغطية تأمينية شاملة لحماية أثاث ومحتويات وحدتك ضد التلف أو الحوادث بشروط عامة."
                )}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#12101a] p-5 shadow-xs">
              <div className="flex items-center gap-2.5 text-sm font-bold text-slate-900 dark:text-white">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                  <TrendingUp size={16} />
                </div>
                <span>{t("100% Free Listing", "تسجيل مجاني 100%")}</span>
              </div>
              <p className="mt-2 text-xs font-normal leading-5 text-slate-500 dark:text-slate-400">
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
