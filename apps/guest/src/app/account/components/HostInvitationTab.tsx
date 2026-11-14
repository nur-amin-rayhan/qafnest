"use client";

import React from "react";
import { Store, ExternalLink } from "lucide-react";
import { ECOSYSTEM_URLS } from "@qafnest/shared";

interface HostInvitationTabProps {
  t: (en: string, ar: string) => string;
}

export default function HostInvitationTab({ t }: HostInvitationTabProps) {
  return (
    <div>
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100 dark:border-white/10">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {t("Host with Us (Register Property)", "سجل عقارك معنا (بوابة المضيفين)")}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t(
              "Join Saudi Arabia's premier licensed luxury property hosting network.",
              "انضم إلى نخبة المضيفين وحقق عوائد استثنائية مع قاف نست للأعمال."
            )}
          </p>
        </div>
      </div>

      {/* Host Promo Showcase */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-tr from-[#330f6b] to-[#6d28d9] text-white shadow-xl shadow-purple-950/20 mb-8 border border-white/20">
        <div className="max-w-xl">
          <span className="px-3 py-1 rounded-full bg-[#FF9750] text-slate-950 text-xs font-black uppercase tracking-wider">
            {t("EARN UP TO 15,400 SAR / MONTH", "عوائد شهرية تصل إلى ١٥,٤٠٠ ر.س")}
          </span>

          <h3 className="text-2xl sm:text-3xl font-black mt-3 mb-2">
            {t(
              "Do you own a chalet, villa, or luxury apartment?",
              "هل تملك شاليه، فيلا، استراحة أو شقة مفروشة؟"
            )}
          </h3>

          <p className="text-sm text-purple-200 leading-relaxed mb-6">
            {t(
              "We handle guest verification, smart lock integration, instant payouts, and Ministry of Tourism licensing compliance seamlessly.",
              "نتولى التحقق من الضيوف، وإدارة الدخول الذكي، وحماية التأمين، والربط مع وزارة السياحة لتضمن راحة البال وأعلى إشغال."
            )}
          </p>

          <a
            href={ECOSYSTEM_URLS.host}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2.5 rounded-2xl bg-[#FF9750] hover:bg-[#ff893b] text-slate-950 font-black px-6 py-3.5 text-sm shadow-lg transition transform active:scale-95"
          >
            <Store size={18} />
            <span>{t("Launch Host Workspace", "الدخول إلى بوابة المضيفين")}</span>
            <ExternalLink size={16} />
          </a>
        </div>
      </div>

      {/* Benchmark Monthly Revenue Table */}
      <div>
        <h4 className="text-sm font-black text-slate-900 dark:text-white mb-3">
          {t("Estimated Monthly Revenue by City", "متوسط الدخل الشهري المتوقع حسب المدينة")}
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
            <p className="text-slate-500">{t("Riyadh Villa / Chalet", "فيلا / شاليه الرياض")}</p>
            <p className="text-base font-black text-[#4F2396] dark:text-[#FF9750] mt-1 font-mono">
              15,400 SAR
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
            <p className="text-slate-500">{t("Jeddah Luxury Flat", "شقة فاخرة جدة")}</p>
            <p className="text-base font-black text-[#4F2396] dark:text-[#FF9750] mt-1 font-mono">
              12,800 SAR
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
            <p className="text-slate-500">{t("AlUla Heritage Resort", "منتجع العلا التراثي")}</p>
            <p className="text-base font-black text-[#4F2396] dark:text-[#FF9750] mt-1 font-mono">
              13,500 SAR
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

